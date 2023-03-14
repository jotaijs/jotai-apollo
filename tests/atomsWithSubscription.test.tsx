import React, { Suspense } from 'react'
import Observable from 'zen-observable'
import { Provider, useAtom } from 'jotai/react'
import { atomsWithSubscription } from 'jotai-apollo'
import { render } from '@testing-library/react'
import { ApolloClient, gql } from '@apollo/client'

it('subscription basic test', async () => {
  const counter = (count: number) => {
    return {
      data: {
        getCount: {
          count,
        },
      },
      loading: false,
    }
  }
  let observable = new Observable((observer) => {
    // Emit a single value after 1 second
    const nums = [0, 1, 2]
    nums.forEach((num, i) => {
      setTimeout(() => {
        observer.next(counter(num))
        if (i === 2) {
          observer.complete()
        }
      }, i * 100)
    })
    return () => {}
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
  const [countAtom, countStatusAtom] = atomsWithSubscription<
    { getCount: { count: number } },
    {}
  >(
    () => ({ query: subscription }),
    () => clientMock
  )

  const Counter = () => {
    const [data] = useAtom(countAtom)
    const [{ loading }] = useAtom(countStatusAtom)
    return (
      <>
        <div>count: {data?.getCount.count}</div>
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
  await findByText('count: 1')
  await findByText('count: 2')
  await findByText('loading: false')
})
