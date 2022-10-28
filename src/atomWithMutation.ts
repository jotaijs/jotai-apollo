import {
  ApolloClient,
  MutationOptions,
  FetchResult,
  OperationVariables,
  DefaultContext,
  ApolloCache,
} from '@apollo/client'
import { WritableAtom } from 'jotai'
import type { Getter } from 'jotai'
import { clientAtom } from './clientAtom'
import { createAtoms, Observer } from './common'

type Action<Data, Variables, Context> = MutationOptions<
  Data,
  Variables,
  Context
>

export function atomsWithMutation<
  Data = any,
  Variables = OperationVariables,
  Context = DefaultContext,
  Extensions = Record<string, any>,
  Result extends FetchResult<Data, Context, Extensions> = FetchResult<
    Data,
    Context,
    Extensions
  >
>(
  getClient: (get: Getter) => ApolloClient<any> = (get) => get(clientAtom)
): readonly [
  dataAtom: WritableAtom<Data, Action<Data, Variables, Context>, Promise<void>>,
  statusAtom: WritableAtom<
    Result,
    Action<Data, Variables, Context>,
    Promise<void>
  >
] {
  const listeners = new WeakMap<ApolloClient<any>, Partial<Observer<any>>>()

  return createAtoms(
    () => {},
    getClient,
    (client) => {
      return {
        subscribe: (observer) => {
          listeners.set(client, observer)
          return {
            unsubscribe: () => {
              listeners.delete(client)
            },
          }
        },
      }
    },
    async (action, client) => {
      const result = await client.mutate(action)
      const listener = listeners.get(client)
      listener?.next?.({
        data: result.data,
        error: result.errors,
        extensions: result.extensions,
      })
    }
  )
}

/* export function atomWithMutation<
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
} */
