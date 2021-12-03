import React, { Suspense } from 'react'
import Observable from 'zen-observable'
import { atom, Provider, useAtom } from 'jotai'
import { atomWithSubscription } from 'jotai-apollo'
import { fireEvent, render } from '@testing-library/react'
import { ApolloClient, gql } from '@apollo/client'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

it('subscription basic test', async () => {
  const observable = Observable.of(0, 1, 2).map(async (count) => {
    await delay(100 * count)
    return {
      data: {
        getCount: {
          count,
        },
      },
    }
  })
  const clientMock = {
    subscribe: () => {
      return observable
    },
  } as unknown as ApolloClient<any>

  const subscription = gql`
    subscription Count {
      getCount {
        count
      }
    }
  `
  const countAtom = atomWithSubscription<{ getCount: { count: number } }, {}>(
    () => ({ query: subscription }),
    () => clientMock
  )

  const Counter = () => {
    const [{ data }] = useAtom(countAtom)
    return (
      <>
        <div>count: {data?.getCount.count}</div>
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
  await findByText('count: 1')
  await findByText('count: 2')
})

it('subscription pause test', async () => {
  const subscription = gql`
    subscription Count {
      getCount {
        count
      }
    }
  `

  const observable = Observable.of(0, 1, 2).map(async (count) => {
    await delay(100 * count)
    return {
      data: {
        getCount: {
          count,
        },
      },
    }
  })
  const clientMock = {
    subscribe: () => {
      return observable
    },
  } as unknown as ApolloClient<any>

  const enabledAtom = atom(false)
  const countAtom = atomWithSubscription<{ getCount: { count: number } }, {}>(
    (get) => ({
      query: subscription,
      pause: !get(enabledAtom),
    }),
    () => clientMock
  )

  const Counter = () => {
    const [result] = useAtom(countAtom)
    return (
      <>
        <div>count: {result ? result.data?.getCount.count : 'paused'}</div>
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

  fireEvent.click(getByText('toggle'))
  await findByText('count: paused')
  await findByText('count: 0')
  await findByText('count: 1')
  await findByText('count: 2')
})

it('subscription null client suspense', async () => {
  const generateClient = () => {
    const observable = Observable.of(0, 1, 2).map(async (count) => {
      await delay(100 * count)
      return {
        data: {
          getCount: {
            count,
          },
        },
      }
    })
    const clientMock = {
      subscribe: () => {
        return observable
      },
    } as unknown as ApolloClient<any>

    return clientMock
  }

  const subscription = gql`
    subscription Count {
      getCount {
        count
      }
    }
  `
  const clientAtom = atom<ApolloClient<unknown> | null>(null)
  const countAtom = atomWithSubscription<{ getCount: { count: number } }, {}>(
    () => ({
      query: subscription,
    }),
    (get) => get(clientAtom) as ApolloClient<unknown>
  )
  // Derived Atom to safe guard when client is null
  const guardedCountAtom = atom(
    (get): { data?: { getCount: { count: number } } | null } => {
      const client = get(clientAtom)
      if (client === null) return {}
      return get(countAtom)
    }
  )

  const Counter = () => {
    const [{ data }] = useAtom(guardedCountAtom)
    return (
      <>
        <div>{data ? <>count: {data?.getCount.count}</> : 'no data'}</div>
      </>
    )
  }

  const Controls = () => {
    const [, setClient] = useAtom(clientAtom)
    return (
      <>
        <button onClick={() => setClient(generateClient())}>set</button>
        <button onClick={() => setClient(null)}>unset</button>
      </>
    )
  }

  const { findByText, getByText } = render(
    <Provider>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
      <Controls />
    </Provider>
  )

  await findByText('no data')
  fireEvent.click(getByText('set'))
  await findByText('loading')
  await findByText('count: 0')
  await findByText('count: 1')
  await findByText('count: 2')
  fireEvent.click(getByText('unset'))
  await findByText('no data')
  fireEvent.click(getByText('set'))
  await findByText('count: 0')
  await findByText('count: 1')
  await findByText('count: 2')
})
