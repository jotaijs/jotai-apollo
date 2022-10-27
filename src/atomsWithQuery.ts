import {
  ApolloClient,
  OperationVariables,
  QueryOptions,
  ApolloQueryResult,
} from '@apollo/client'
import { Getter, WritableAtom } from 'jotai'
import { clientAtom } from './clientAtom'
import { createAtoms } from './common'

type QueryArgs<
  Variables extends object = OperationVariables,
  Data = any
> = QueryOptions<Variables, Data>

type AtomWithQueryAction<
  Variables extends object = OperationVariables,
  Data = any
> = {
  type: 'refetch'
  opts?: Partial<QueryArgs<Variables, Data>>
}

export const atomsWithQuery = <
  Data,
  Variables extends object = OperationVariables
>(
  getArgs: (get: Getter) => QueryArgs<Variables, Data>,
  getClient: (get: Getter) => ApolloClient<any> = (get) => get(clientAtom)
): readonly [
  WritableAtom<Data, AtomWithQueryAction>,
  WritableAtom<ApolloQueryResult<Data>, AtomWithQueryAction>
] => {
  return createAtoms(
    getArgs,
    getClient,
    (client, args) => {
      return {
        subscribe: (observer) => {
          client
            .query(args)
            .then((result) => {
              observer.next?.(result)
            })
            .catch((error) => {
              observer.error?.(error)
            })
          return { unsubscribe: () => {} }
        },
      }
    },
    (action: AtomWithQueryAction, _client, refresh) => {
      if (action.type === 'refetch') {
        refresh()
        return
      }
    }
  )
}
