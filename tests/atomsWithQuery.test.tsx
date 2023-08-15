import React, { Suspense } from 'react'
import { Provider, useAtom } from 'jotai/react'
import { atomsWithQuery } from 'jotai-apollo'
import { fireEvent, render } from '@testing-library/react'
import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { MockLink } from '@apollo/client/testing'

it('basic atomsWithQuery test', async () => {
  const query = gql`
    query Count {
      getCount {
        count
      }
    }
  `

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new MockLink([
      {
        request: { query },
        result: { data: { getCount: { count: 0 } } },
      },
    ]),
  })

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

  const query = gql`
    query GetUser($name: String!) {
      user(name: $name) {
        id
      }
    }
  `

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new MockLink([
      {
        request: { query, variables: { name: 'aslemammad' } },
        result: { data: { user: { id: users['aslemammad'] } } },
      },
    ]),
  })

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
  let count = 1

  const query = gql`
    query Count($count: Int) {
      getCount(count: $count) {
        count
      }
    }
  `

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new MockLink([
      {
        request: { query, variables: { count: 1 } },
        result: { data: { getCount: { count: 4 } } },
      },
      {
        request: { query, variables: { count: 2 } },
        result: { data: { getCount: { count: 5 } } },
      },
      {
        request: { query, variables: { count: 3 } },
        result: { data: { getCount: { count: 6 } } },
      },
    ]),
  })

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
            count++
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
  await findByText('count: 4')
  fireEvent.click(getByText('button'))
  await findByText('loading')
  await findByText('count: 5')
  fireEvent.click(getByText('button'))
  await findByText('loading')
  await findByText('count: 6')
  expect(fetchCountMock).toBeCalledTimes(3)
})
