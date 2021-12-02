## Install

You have to install `@apollo/client`, `jotai` and `wonka` to access this bundle and its functions.

```
yarn add jotai @apollo/client graphql wonka
```

## atomWithQuery

`atomWithQuery` creates a new atom with a query. It internally uses [client.query](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.query).

```ts
import { useAtom } from 'jotai'
import { ApolloClient } from '@apollo/client'
import { atomWithQuery } from 'jotai-apollo'

const client = new ApolloClient({ ... })

const query = gql`
  query Count {
    getCount {
      count
    }
  }
`

const countAtom = atomWithQuery(
  (get) => ({
    query
  }),
  () => client, // optional
)

const App = () => {
  const [{ data }] = useAtom(countAtom)
  return <div>{JSON.stringify(data)}</div>
}
```

### Examples

TODO

## atomWithMutation

`atomWithMutation` creates a new atom with a mutation. It internally uses [client.mutation](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.mutate).

```js
import { useAtom } from 'jotai'
import { ApolloClient } from '@apollo/client'
import { atomWithMutation } from 'jotai-apollo'

const client = new ApolloClient({ ... })

const mutation = gql`
  mutation Count {
    setCount {
      count
    }
  }
`

const countAtom = atomWithMutation(
  (get) => ({
    mutation
  }),
  () => client,
)

const App = () => {
  const [{ data }, mutate] = useAtom(countAtom)
  return <div>{JSON.stringify(data)} <button onClick={mutate}>Click me</button></div>
}
```

### Examples

TODO

## atomWithSubscription

`atomWithSubscription` creates a new atom with a mutation. It internally uses [client.subscription](https://www.apollographql.com/docs/react/api/core/ApolloClient/#ApolloClient.subscribe).

```js
import { useAtom } from 'jotai'
import { ApolloClient } from '@apollo/client'
import { atomWithSubscription } from 'jotai-apollo'

const client = new ApolloClient({ ... })

const subscription = gql`
  subscription Count {
    getCount {
      count
    }
  }
`

const countAtom = atomWithSubscription(
  (get) => ({
    query: subscription
  }),
  () => client
)

const App = () => {
  const [{ data }] = useAtom(countAtom)
  return <div>{JSON.stringify(data)}</div>
}
```

### Examples

TODO
