import React, { Suspense } from 'react'
import { atom, Provider, useAtom } from 'jotai'
import { atomWithQuery } from 'jotai-apollo'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { ApolloClient, gql } from '@apollo/client'

it('basic atomWithQuery test', async () => {
  let count = 0
  const clientMock = {
    query: async () => {
      const currentCount = count
      count++
      return {
        data: {
          getCount: {
            count: currentCount,
          },
        },
      }
    },
  } as unknown as ApolloClient<any>

  const query = gql`
    query Count {
      getCount {
        count
      }
    }
  `

  const countAtom = atomWithQuery<{ getCount: { count: number } }, {}>(
    () => ({
      query,
    }),
    () => clientMock
  )

  const Counter = () => {
    const [{ data }] = useAtom(countAtom)
    return (
      <>
        <div>count: {data.getCount.count}</div>
      </>
    )
  }

  const { findByText, getByText } = render(
    <Provider>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </Provider>
  )

  await findByText('loading')
  await findByText('count: 0')
  waitFor(() => {
    getByText('count: 1')
    getByText('count: 2')
    getByText('count: 3')
  })
})

it('variables atomWithQuery test', async () => {
  const users: Record<string, number> = {
    aslemammad: 0,
    daishi: 1,
  }

  const clientMock = {
    query: async ({ variables }: { variables: { name: string } }) => {
      return {
        data: {
          user: {
            id: users[variables.name],
          },
        },
      }
    },
  } as unknown as ApolloClient<any>

  const query = gql`
    query GetUser($name: String!) {
      user(name: $name) {
        id
      }
    }
  `

  const countAtom = atomWithQuery<{ user: { id: number } }, { name: string }>(
    () => ({
      query,
      variables: { name: 'aslemammad' },
    }),
    () => clientMock
  )

  const Counter = () => {
    const [{ data }] = useAtom(countAtom)
    return (
      <>
        <div>count: {data.user.id}</div>
      </>
    )
  }

  const { findByText } = render(
    <Provider>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </Provider>
  )

  await findByText('loading')
  await findByText('count: 0')
})

it('pause test', async () => {
  const clientMock = {
    query: async () => {
      return {
        data: {
          getCount: {
            count: 0,
          },
        },
      }
    },
  } as unknown as ApolloClient<any>

  const query = gql`
    query Count {
      getCount {
        count
      }
    }
  `

  const enabledAtom = atom(false)

  const countAtom = atomWithQuery<{ getCount: { count: number } }, {}>(
    (get) => ({
      query,
      pause: !get(enabledAtom),
    }),
    () => clientMock
  )

  const Counter = () => {
    const [result] = useAtom(countAtom)
    return (
      <>
        <div>count: {result ? result.data.getCount.count : 'paused'}</div>
      </>
    )
  }

  const Controls = () => {
    const [, setEnabled] = useAtom(enabledAtom)
    return <button onClick={() => setEnabled((x) => !x)}>toggle</button>
  }

  const { getByText, findByText } = render(
    <Provider>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
      <Controls />
    </Provider>
  )

  await findByText('count: paused')

  fireEvent.click(getByText('toggle'))
  await findByText('loading')
  await findByText('count: 0')
})

it('reexecute test', async () => {
  let count = 0

  const clientMock = {
    query: async ({ variables }: { variables: { count: number } }) => {
      return {
        data: {
          getCount: {
            count: variables.count,
          },
        },
      }
    },
  } as unknown as ApolloClient<any>

  const query = gql`
    query Count($count: Int) {
      getCount(count: $count) {
        count
      }
    }
  `

  const countAtom = atomWithQuery<
    { getCount: { count: number } },
    { count: number }
  >(
    () => ({
      query,
      variables: { count: count },
    }),
    () => clientMock
  )

  const Counter = () => {
    const [{ data }, dispatch] = useAtom(countAtom)
    return (
      <>
        <div>count: {data.getCount.count}</div>
        <button
          onClick={() => {
            count = count + 1
            dispatch({ type: 'reexecute', opts: { variables: { count } } })
          }}>
          button
        </button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <Provider>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </Provider>
  )

  await findByText('loading')
  await findByText('count: 0')

  fireEvent.click(getByText('button'))
  await findByText('loading')
  await findByText('count: 1')
})

it('query null client suspense', async () => {
  const generateClient = (count = 0) => {
    return {
      query: async () => {
        return {
          data: {
            getCount: {
              count,
            },
          },
        }
      },
    } as unknown as ApolloClient<unknown>
  }

  const query = gql`
    query Count {
      getCount {
        count
      }
    }
  `
  const client = generateClient(0)
  const clientAtom = atom<ApolloClient<unknown> | null>(null)
  const countAtom = atomWithQuery<
    { getCount: { count: number } },
    Record<string, never>
  >(
    () => ({
      query,
    }),
    (get) => get(clientAtom) as ApolloClient<unknown>
  )
  // Derived Atom to safe guard when client is null
  const guardedCountAtom = atom(
    (get): { data?: { getCount: { count: number } } } => {
      const client = get(clientAtom)
      if (client === null) return {}
      return get(countAtom)
    }
  )

  const Identifier = () => {
    const [{ data }] = useAtom(guardedCountAtom)
    return (
      <>
        <div>{data?.getCount.count ? data?.getCount.count : 'no data'}</div>
      </>
    )
  }

  const Controls = () => {
    const [, setClient] = useAtom(clientAtom)
    return (
      <>
        <button onClick={() => setClient(null)}>unset</button>
        <button onClick={() => setClient(client)}>set</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <Provider>
      <Suspense fallback="loading">
        <Identifier />
      </Suspense>
      <Controls />
    </Provider>
  )

  await findByText('no data')
  fireEvent.click(getByText('set'))
  await findByText('loading')
  waitFor(() => {
    getByText('0')
  })
  fireEvent.click(getByText('unset'))
  await findByText('no data')
  fireEvent.click(getByText('set'))
  await findByText('loading')
  waitFor(() => {
    getByText('0')
  })
})
