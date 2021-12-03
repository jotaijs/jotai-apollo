import {
  ApolloClient,
  DefaultContext,
  FetchResult,
  OperationVariables,
  SubscriptionOptions,
} from '@apollo/client'
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
    if (args.pause) {
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

    const listener = async (
      result: FetchResult<Data, any, any> | Promise<FetchResult<Data, any, any>>
    ) => {
      const resolvedResult = await result
      if (!('data' in resolvedResult)) {
        throw new Error('result does not have data')
      }
      if (resolve) {
        resolve(resolvedResult)
        resolve = null
      } else {
        setResult(resolvedResult)
      }
    }

    const subscriptionInRender = client.subscribe(args).subscribe(listener)

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
        subscription = client.subscribe(args).subscribe(listener)
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
