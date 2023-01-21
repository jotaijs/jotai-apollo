import { ApolloClient, ApolloQueryResult } from '@apollo/client'
import { atom } from 'jotai'
import { atomWithObservable } from 'jotai/utils'
import type { Getter } from 'jotai'

type Client<T extends unknown = unknown> = ApolloClient<T>

export type Observer<T> = {
  next: (value: T) => void
  error: (error: any) => void
  complete: () => void
}

export type Subscription<T> = {
  subscribe(observer: Partial<Observer<T>>): { unsubscribe: () => void }
}

export const createAtoms = <
  Args,
  Data,
  Result extends Subscription<any>,
  Action,
  ActionResult extends Promise<void> | void = void
>(
  getArgs: (get: Getter) => Args,
  getClient: (get: Getter) => Client,
  execute: (client: Client, args: Args) => Result,
  handleAction: (
    action: Action,
    client: Client,
    refresh: () => void
  ) => ActionResult
) => {
  const refreshAtom = atom(0)

  const sourceAtom = atom((get) => {
    get(refreshAtom)
    const args = getArgs(get)
    const client = getClient(get)
    return execute(client, args)
  })

  const baseStatusAtom = atom((get) => {
    const source = get(sourceAtom)
    const resultAtom = atomWithObservable(() => source)
    return resultAtom
  })

  const statusAtom = atom(
    (get) => {
      const resultAtom = get(baseStatusAtom)
      return get(resultAtom)
    },
    (get, set, action: Action) => {
      const client = getClient(get)
      const refresh = () => {
        set(refreshAtom, (c) => c + 1)
      }
      return handleAction(action, client, refresh)
    }
  )

  const baseDataAtom = atom((get) => {
    const source = get(sourceAtom)

    return atomWithObservable(() => ({
      subscribe: (observer: Observer<any>) => {
        const subscription = source.subscribe({
          next: (result) => {
            if (result.data) {
              observer.next?.(result)
            }
          },
          error: (error) => {
            observer.error?.(error)
          },
        })

        return subscription
      },
    }))
  })

  const dataAtom = atom(
    (get) => {
      const resultAtom = get(baseDataAtom)
      const result = get(resultAtom)

      if (result.error) {
        throw result.error
      }
      return result.data
    },
    (_get, set, action: Action) => set(statusAtom, action)
  )

  return [dataAtom, statusAtom] as const
}
