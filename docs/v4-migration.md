# v4 Migration

## Overview

Version 4 introduces a more intuitive API with stronger typing and better transaction handling by leveraging the `AlgorandClient` and ARC-56 support. This guide helps you transition existing code using an older typed client.

## Quick Migration Checklist

1. Update client initialization to use `AppFactory`
1. Convert method calls to use `send` with explicit `args`
1. Replace `compose()` with `newGroup()` for transactions

## Step-by-Step Changes

> For the sake of brevity, the examples below are simplified and do not include all the details of the original code and are based on the ['helloworld'](../examples/helloworld/application.json) example.

### 1. Client Initialization (Factory Pattern)

**Before (v3):**

```typescript
// Direct client creation required manual setup
const client = new HelloWorldAppClient(
  {
    resolveBy: 'creatorAndName',
    sender: deployer,
    creatorAddress: deployer.addr,
    findExistingUsing: indexer,
  },
  algod,
)
const result = await client.deploy()
```

**After (v4):**

```typescript
// Factory handles deployment and configuration and makes it easy to manage multiple instances of the app
const factory = algorand.client.getTypedAppFactory(HelloWorldAppFactory, {
  defaultSender: deployer.addr,
  defaultSigner: deployer.signer,
})
const { result, appClient: client } = await factory.deploy() // Returns ready-to-use client along with the deployment result
```

### 2. Making Method Calls

**Before (v3):**

```typescript
// Send a transaction
const result = await client.hello({ name: 'World' })

// Create a transaction/s for sending later.
const { transactions } = await client.hello({ name: 'World' }, { sendParams: { skipSending: true } })
```

**After (v4):**

```typescript
// Send a transaction
const result = await client.send.hello({ args: { name: 'World' } })

// Create a transaction/s for sending later. No need for skipSending: true.
const { transactions } = await client.createTransaction.hello({ args: { name: 'World' } })
```

### 3. Transaction Groups

**Before (v3):**

```typescript
const { transaction } = await client.hello({ name: 'Mate' }, { sendParams: { skipSending: true } })
const result = await client.compose().hello({ name: 'World' }).addTransaction(transaction).execute()

expect(result.returns[0]).toBe('Hello, World')
expect(result.returns[1]).toBe('Hello, Mate')
```

**After (v4):**

```typescript
const { transactions } = await client.createTransaction.hello({ args: { name: 'Mate' } })
const result = await client
  .newGroup()
  .hello({ args: { name: 'World' } })
  .addTransaction(transactions[0])
  .send()

expect(result.returns[0]).toBe('Hello, World')
expect(result.returns[1]).toBe('Hello, Mate')
```

### 4. Deployment Configuration

**Before (v3):**

```typescript
const result = await client.deploy({
  onUpdate: OnUpdate.UpdateApp,
  onSchemaBreak: OnSchemaBreak.Fail,
  allowDelete: true,
  allowUpdate: true,
})
const appId = result.appId
```

**After (v4):**

```typescript
const { result, appClient } = await factory.deploy({
  onUpdate: OnUpdate.UpdateApp,
  onSchemaBreak: OnSchemaBreak.Fail,
  deletable: true,
  updatable: true,
})

const appId = result.appId
```

Need help? Submit an issue on [GitHub](https://github.com/algorandfoundation/algokit-client-generator-ts/issues). For reference on the application specification refer to [ARC-56 specification](https://arc.algorand.foundation/ARCs/arc-0056).
