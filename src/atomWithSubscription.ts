import {
  ApolloClient,
  DefaultContext,
  FetchResult,
  OperationVariables,
  SubscriptionOptions,
} from '@apollo/client'
import { fromObservable, pipe, skip, subscribe } from 'wonka'
import { atom } from 'jotai'
import type { Atom, Getter } from 'jotai'
import { clientAtom } from './clientAtom'

type SubscriptionArgsWithPause<
  Variables = OperationVariables,
  Data = any
> = SubscriptionOptions<Variables, Data> & {
  pause?: boolean
}

export function atomWithSubscription<
  Data,
  Variables extends object,
  Context = DefaultContext,
  Extensions = Record<string, any>
>(
  createSubscriptionArgs: (
    get: Getter
  ) => SubscriptionArgsWithPause<Variables, Data>,
  getClient?: (get: Getter) => ApolloClient<unknown>
): Atom<FetchResult<Data, Context, Extensions>>

export function atomWithSubscription<
  Data,
  Variables extends object,
  Context = DefaultContext,
  Extensions = Record<string, any>
>(
  createSubscriptionArgs: (
    get: Getter
  ) => SubscriptionArgsWithPause<Variables, Data>,
  getClient?: (get: Getter) => ApolloClient<unknown>
): Atom<FetchResult<Data, Context, Extensions> | null>

export function atomWithSubscription<
  Data,
  Variables extends object,
  Context = DefaultContext,
  Extensions = Record<string, any>
>(
  createSubscriptionArgs: (
    get: Getter
  ) => SubscriptionArgsWithPause<Variables, Data>,
  getClient: (get: Getter) => ApolloClient<unknown> = (get) => get(clientAtom)
) {
  const subscriptionResultAtom = atom((get) => {
    const args = createSubscriptionArgs(get)
    if ((args as { pause?: boolean }).pause) {
      return { args }
    }
    const client = getClient(get)
    let resolve:
      | ((result: FetchResult<Data, Context, Extensions>) => void)
      | null = null
    const resultAtom = atom<
      | FetchResult<Data, Context, Extensions>
      | Promise<FetchResult<Data, Context, Extensions>>
    >(
      new Promise<FetchResult<Data, Context, Extensions>>((r) => {
        resolve = r
      })
    )
    let setResult: (
      result: FetchResult<Data, Context, Extensions>
    ) => void = () => {
      throw new Error('setting result without mount')
    }
    const listener = (result: FetchResult<Data, Context, Extensions>) => {
      if (resolve) {
        resolve(result)
        resolve = null
      } else {
        setResult(result)
      }
    }

    const source = fromObservable<FetchResult<Data, Context, Extensions>>(
      client.subscribe(args)
    )
    const subscriptionInRender = pipe(source, subscribe(listener))

    let timer: NodeJS.Timeout | null = setTimeout(() => {
      timer = null
      subscriptionInRender.unsubscribe()
    }, 1000)

    resultAtom.onMount = (update) => {
      setResult = update
      let subscription: typeof subscriptionInRender
      if (timer) {
        clearTimeout(timer)
        subscription = subscriptionInRender
      } else {
        const mountSource = fromObservable<
          FetchResult<Data, Context, Extensions>
        >(client.subscribe(args))

        subscription = pipe(mountSource, subscribe(listener))
      }

      return () => subscription.unsubscribe()
    }
    return { resultAtom, args }
  })
  const queryAtom = atom((get) => {
    const { resultAtom } = get(subscriptionResultAtom)
    return resultAtom ? get(resultAtom) : null
  })
  return queryAtom
}
