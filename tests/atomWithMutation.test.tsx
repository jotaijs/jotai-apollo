import React, { Suspense } from 'react'
import { atom, Provider, useAtom } from 'jotai'
import { ApolloClient, gql } from '@apollo/client'
import { atomWithMutation } from 'jotai-apollo'
import { fireEvent, render } from '@testing-library/react'

it('mutation basic test', async () => {
  const clientMock = {
    mutate: async () => {
      return {
        data: {
          setCount: {
            count: 0,
          },
        },
      }
    },
  } as unknown as ApolloClient<any>

  const mutation = gql`
    mutation Count {
      setCount {
        count
      }
    }
  `
  const countAtom = atomWithMutation<
    { setCount: { count: number } },
    Record<string, never>
  >(
    () => ({ mutation }),
    () => clientMock
  )
  const mutateAtom = atom(null, (_get, set) => {
    set(countAtom, {})
  })

  const Counter = () => {
    const [{ data }] = useAtom(countAtom)
    return (
      <>
        <div>count: {data?.setCount.count}</div>
      </>
    )
  }

  const Controls = () => {
    const [, mutate] = useAtom(mutateAtom)
    return <button onClick={() => mutate()}>mutate</button>
  }

  const { getByText, findByText } = render(
    <Provider>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
      <Controls />
    </Provider>
  )

  await findByText('loading')

  fireEvent.click(getByText('mutate'))
  await findByText('count: 0')
})
