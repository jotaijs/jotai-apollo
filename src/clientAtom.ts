import { InMemoryCache, ApolloClient } from '@apollo/client'
import { atom } from 'jotai'

const DEFAULT_URL =
  (typeof process === 'object' && process.env.JOTAI_APOLLO_DEFAULT_URL) ||
  '/graphql'

const client = new ApolloClient({
  uri: DEFAULT_URL,
  cache: new InMemoryCache(),
})

export const clientAtom = atom(client)
