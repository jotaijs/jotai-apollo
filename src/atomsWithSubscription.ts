import {
  ApolloClient,
  OperationVariables,
  SubscriptionOptions,
  SubscriptionResult,
} from '@apollo/client'
import type { Getter, WritableAtom } from 'jotai/vanilla'
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
  dataAtom: WritableAtom<Data | Promise<Data>, [Action], void>,
  statusAtom: WritableAtom<SubscriptionResult<Data, Variables>, [Action], void>
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
