import {
  ApolloClient,
  MutationOptions,
  FetchResult,
  OperationVariables,
  DefaultContext,
  ApolloCache,
} from '@apollo/client'
import { atom } from 'jotai'
import type { Getter } from 'jotai'
import { clientAtom } from './clientAtom'

export function atomWithMutation<
  Data = any,
  Variables = OperationVariables,
  Context = DefaultContext,
  Cache extends ApolloCache<any> = ApolloCache<any>,
  Extensions = Record<string, any>
>(
  createMutationArgs: (
    get: Getter
  ) => MutationOptions<Data, Variables, Context, Cache>,
  getClient: (get: Getter) => ApolloClient<unknown> = (get) => get(clientAtom)
) {
  const operationResultAtom = atom<
    | FetchResult<Data, Context, Extensions>
    | Promise<FetchResult<Data, Context, Extensions>>
  >(
    new Promise<FetchResult<Data, Context, Extensions>>(() => {}) // infinite pending
  )
  const mutationResultAtom = atom(
    (get) => get(operationResultAtom),
    (
      get,
      set,
      action: Omit<MutationOptions<Data, Variables, Context, Cache>, 'mutation'>
    ) => {
      set(
        operationResultAtom,
        new Promise<FetchResult<Data, Context, Extensions>>(() => {}) // new fetch
      )
      const client = getClient(get)
      const mutation = createMutationArgs(get)

      client
        .mutate({
          ...mutation,
          ...action,
        } as MutationOptions)
        .then((result) => {
          set(
            operationResultAtom,
            result as FetchResult<Data, Context, Extensions>
          )
        })
        .catch(() => {
          // TODO error handling
        })
    }
  )
  return mutationResultAtom
}
