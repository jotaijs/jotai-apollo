import {
  ApolloClient,
  OperationVariables,
  SubscriptionOptions,
  SubscriptionResult,
} from '@apollo/client'
import { WritableAtom } from 'jotai'
import type { Getter } from 'jotai'
import { clientAtom } from './clientAtom'
import { createAtoms } from './common'

type Action = {
  readonly type: 'refetch'
}

export function atomsWithSubscription<
  Data,
  Variables extends object = OperationVariables
>(
  getArgs: (get: Getter) => SubscriptionOptions<Variables, Data>,
  getClient: (get: Getter) => ApolloClient<any> = (get) => get(clientAtom)
): readonly [
  dataAtom: WritableAtom<Data, Action>,
  statusAtom: WritableAtom<SubscriptionResult<Data, Variables>, Action>
] {
  return createAtoms(
    (get) => getArgs(get),
    getClient,
    (client, args) => {
      return client.subscribe(args)
    },
    (action, _client, refresh) => {
      if (action.type === 'refetch') {
        refresh()
        return
      }
    }
  )
}
