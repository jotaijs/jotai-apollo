import React, { Suspense } from 'react'
import Observable from 'zen-observable'
import { Provider, useAtom } from 'jotai'
import { atomWithSubscription } from 'jotai-apollo'
import { render, waitFor } from '@testing-library/react'
import { ApolloClient, gql } from '@apollo/client'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

it('subscription basic test', async () => {
  const observable = Observable.of(0, 1, 2).map(async (count) => {
    await delay(10)
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

  const { findByText, getByText } = render(
    <Provider>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </Provider>
  )

  await findByText('loading')
  waitFor(() => {
    getByText('count: 0')
  })
  waitFor(() => {
    getByText('count: 1')
  })
  waitFor(() => {
    getByText('count: 2')
  })
})
