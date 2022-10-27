import React, { Suspense } from 'react'
import { atom, Provider, useAtom } from 'jotai'
import { atomsWithQuery } from 'jotai-apollo'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { ApolloClient, gql, InMemoryCache } from '@apollo/client'

it('basic atomsWithQuery test', async () => {
  let count = 0
  const client = new ApolloClient({ cache: new InMemoryCache() })

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

  client.query = clientMock.query

  const query = gql`
    query Count {
      getCount {
        count
      }
    }
  `

  const [countAtom] = atomsWithQuery<{ getCount: { count: number } }, {}>(
    () => ({
      query,
    }),
    () => client
  )

  const Counter = () => {
    const [data] = useAtom(countAtom)
    return (
      <>
        <div>count: {data.getCount.count}</div>
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

it('variables atomsWithQuery test', async () => {
  const users: Record<string, number> = {
    aslemammad: 0,
    daishi: 1,
  }

  const client = new ApolloClient({ cache: new InMemoryCache() })

  const clientMock = {
    query: async ({ variables }: { variables: { name: string } }) => {
      return {
        loading: false,
        data: {
          user: {
            id: users[variables.name],
          },
        },
      }
    },
  } as unknown as ApolloClient<any>

  client.query = clientMock.query

  const query = gql`
    query GetUser($name: String!) {
      user(name: $name) {
        id
      }
    }
  `

  const [countAtom, countStatusAtom] = atomsWithQuery<
    { user: { id: number } },
    { name: string }
  >(
    () => ({
      query,
      variables: { name: 'aslemammad' },
    }),
    () => client
  )

  const Counter = () => {
    const [data] = useAtom(countAtom)
    const [{ loading }] = useAtom(countStatusAtom)
    return (
      <>
        <div>count: {data.user.id}</div>
        <div>loading: {loading ? 'true' : 'false'}</div>
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
  await findByText('loading: false')
})

it('reexecute test atomsWithQuery', async () => {
  let count = Math.random()

  const client = new ApolloClient({ cache: new InMemoryCache() })
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

  client.query = clientMock.query

  const query = gql`
    query Count($count: Int) {
      getCount(count: $count) {
        count
      }
    }
  `

  const fetchCountMock = jest.fn()

  const [countAtom] = atomsWithQuery<
    { getCount: { count: number } },
    { count: number }
  >(
    () => {
      fetchCountMock()

      return {
        query,
        variables: { count: count },
      }
    },
    () => client
  )

  const Counter = () => {
    const [data, dispatch] = useAtom(countAtom)
    return (
      <>
        <div>count: {data.getCount.count}</div>
        <button
          onClick={() => {
            count = Math.random()
            dispatch({ type: 'refetch' })
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
  fireEvent.click(getByText('button'))
  fireEvent.click(getByText('button'))
  expect(fetchCountMock).toBeCalledTimes(3)
})
