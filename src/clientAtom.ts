import {
  InMemoryCache,
  ApolloClient,
  NormalizedCacheObject,
} from '@apollo/client'
import { atom } from 'jotai/vanilla'

const DEFAULT_URL =
  (typeof process === 'object' && process.env.JOTAI_APOLLO_DEFAULT_URL) ||
  '/graphql'

let defaultClient: ApolloClient<NormalizedCacheObject> | null = null

const customClientAtom = atom<ApolloClient<unknown> | null>(null)

export const clientAtom = atom(
  (get) => {
    const customClient = get(customClientAtom)

    if (customClient) {
      return customClient
    }

    if (!defaultClient) {
      defaultClient = new ApolloClient({
        uri: DEFAULT_URL,
        cache: new InMemoryCache(),
      })
    }

    return defaultClient
  },
  (_get, set, client: ApolloClient<unknown>) => {
    set(customClientAtom, client)
  }
)
