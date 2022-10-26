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

/* export function atomWithQuery<
  Data = any,
  Variables extends object = OperationVariables
>(
): WritableAtom<Data, AtomWithQueryAction<Variables, Data>>

export function atomWithQuery<
  Data = any,
  Variables extends object = OperationVariables
>(
  createQueryArgs: (get: Getter) => QueryArgs<Variables, Data>,
  getClient: (get: Getter) => ApolloClient<unknown> = (get) => get(clientAtom)
) {
  type Result = { data: Data | null | undefined } | { error: ApolloError }

  const queryResultAtom = atom((get) => {
    const args = createQueryArgs(get)
    const client = getClient(get)
    let resolve: ((result: Result) => void) | null = null
    const makePending = () =>
      new Promise<Result>((r) => {
        resolve = r
      })
    const resultAtom = atom<Result | Promise<Result>>(makePending())
    let setResult: ((result: Result) => void) | null = null
    const listener = (result: Result) => {
      if (!resolve && !setResult) {
        throw new Error('setting result without mount')
      }
      if (resolve) {
        resolve(result)
        resolve = null
      }
      if (setResult) {
        setResult(result)
      }
    }
    let unsubscribe: (() => void) | null = null
    let timer: Timeout | undefined
    const startQuery = (opts?: Partial<QueryArgs<Variables, Data>>) => {
      if (!setResult && unsubscribe) {
        clearTimeout(timer!)
        unsubscribe()
        unsubscribe = null
      }
      client
        .query({ ...args, ...opts })
        .then(listener)
        .catch((error) => listener({ error }))

      unsubscribe = client.subscribe(args).subscribe({
        next: ({ data }) => listener({ data }),
        error: (error) => listener({ error }),
      }).unsubscribe

      if (!setResult) {
        // not mounted yet
        timer = setTimeout(() => {
          if (unsubscribe) {
            unsubscribe()
            unsubscribe = null
          }
        }, 1000)
      }
    }
    startQuery()
    resultAtom.onMount = (update) => {
      setResult = update
      if (unsubscribe) {
        clearTimeout(timer!)
      } else {
        startQuery()
      }
      return () => {
        setResult = null
        if (unsubscribe) {
          unsubscribe()
          // FIXME why does this fail?
          // unsubscribe = null
        }
      }
    }
    return { resultAtom, makePending, startQuery }
  })

  const queryAtom = atom(
    (get) => {
      const { resultAtom } = get(queryResultAtom)!
      const result = get(resultAtom)
      if ('error' in result) {
        throw result.error
      }
      return result.data
    },
    (get, set, action: AtomWithQueryAction<Variables, Data>) => {
      const { resultAtom, makePending, startQuery } = get(queryResultAtom)!
      switch (action.type) {
        case 'refetch': {
          set(resultAtom, makePending())
          startQuery(action.opts)
          return
        }
      }
    }
  )

  return queryAtom
} */
