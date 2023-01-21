# Jotai Apollo 🚀👻

[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/poimandres)

Minimal `@apollo/client` integration for jotai, similar to `jotai/urql`.

## Install

You have to install `@apollo/client` and `jotai` to access this bundle and its functions.

```
yarn add jotai-apollo jotai @apollo/client
```

## atomsWithQuery

`atomsWithQuery` creates two atoms with a query. It internally uses [client.query](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query).

```ts
import { useAtom } from 'jotai'
import { ApolloClient, gql } from '@apollo/client'
import { atomsWithQuery } from 'jotai-apollo'

const client = new ApolloClient({ ... })

const query = gql`
  query Count {
    getCount {
      count
    }
  }
`
const [countAtom, countStatusAtom] = atomsWithQuery(
  (get) => ({
    query
  }),
  () => client, // optional
)

const App = () => {
  const [data] = useAtom(countAtom)
  return <div>{JSON.stringify(data)}</div>
}
```

type:

```ts
export const atomsWithQuery = <
  Data,
  Variables extends object = OperationVariables
>(
  getArgs: (get: Getter) => QueryArgs<Variables, Data>,
  getClient: (get: Getter) => ApolloClient<any> = (get) => get(clientAtom)
): readonly [
  dataAtom: WritableAtom<Data, AtomWithQueryAction>,
  statusAtom: WritableAtom<ApolloQueryResult<Data>, AtomWithQueryAction>
]
```

### Examples

[Rick & Morty characters](https://stackblitz.com/edit/react-ts-wjkdmk?file=index.tsx)

## atomsWithMutation

`atomsWithMutation` creates two atoms with a mutation. It internally uses [client.mutate](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate).

```js
import { useAtom } from 'jotai'
import { ApolloClient, gql } from '@apollo/client'
import { atomsWithMutation } from 'jotai-apollo'

const client = new ApolloClient({ ... })

const mutation = gql`
  mutation Count {
    setCount {
      count
    }
  }
`

const [countAtom, countStatusAtom] = atomsWithMutation(
  (get) => ({
    mutation
  }),
  () => client,
)

const App = () => {
  const [data, mutate] = useAtom(countAtom)
  return <div>{JSON.stringify(data)} <button onClick={mutate}>Click me</button></div>
}
```

type:

```ts
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
]
```

### Examples

Contributions are welcome.

## atomsWithSubscription

`atomsWithSubscription` creates two atoms with a mutation. It internally uses [client.subscribe](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.subscribe).

```js
import { useAtom } from 'jotai'
import { ApolloClient, gql } from '@apollo/client'
import { atomsWithSubscription } from 'jotai-apollo'

const client = new ApolloClient({ ... })

const subscription = gql`
  subscription Count {
    getCount {
      count
    }
  }
`

const [countAtom, countStatusAtom] = atomsWithSubscription(
  (get) => ({
    query: subscription
  }),
  () => client
)

const App = () => {
  const [data] = useAtom(countAtom)
  return <div>{JSON.stringify(data)}</div>
}
```

type:

```ts
export function atomsWithSubscription<
  Data,
  Variables extends object = OperationVariables
>(
  getArgs: (get: Getter) => SubscriptionOptions<Variables, Data>,
  getClient: (get: Getter) => ApolloClient<any> = (get) => get(clientAtom)
): readonly [
  dataAtom: WritableAtom<Data, Action>,
  statusAtom: WritableAtom<SubscriptionResult<Data, Variables>, Action>
]
```

### Examples

Contributions are welcome.

### Contributing

If you have found what you think is a bug/feature, please [file an issue](https://github.com/pmndrs/jotai-apollo/issues/new).

For questions around this integration, prefer [starting a discussion](https://github.com/pmndrs/jotai-apollo/discussions/new).
