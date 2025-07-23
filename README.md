# AlgoKit TypeScript client generator (algokit-client-generator-ts)

This project generates a type-safe smart contract client in TypeScript for the Algorand Blockchain that wraps the [application client](https://github.com/algorandfoundation/algokit-utils-ts/blob/main/docs/capabilities/app-client.md) in [AlgoKit Utils](https://github.com/algorandfoundation/algokit-utils-ts) and tailors it to a specific smart contract. It does this by reading an [ARC-56](https://github.com/algorandfoundation/ARCs/pull/258) or [ARC-32](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0032.md) application spec file and generating a client which exposes methods for each ABI method in the target smart contract, along with helpers to create, update, and delete the application.

## Usage

### Prerequisites

To be able to consume the generated file you need to include it in a TypeScript project that has (at least) the following package installed:

```
npm install @algorandfoundation/algokit-utils
```

Note: you need at least version 7 of AlgoKit Utils to work with the latest version of the generator. It currently only works with algosdk v2.

### Migration

If you're migrating your project from an older generated typed client to v4, please refer to the [v4 migration guide](./docs/v4-migration.md).

### Use

The cli can be used to generate a client via the following command.

```bash
npx --yes  @algorandfoundation/algokit-client-generator generate -a ./application.json -o ./client.generated.ts
```

#### CLI Options

The CLI supports the following options:

- `-a, --application <path>` (required): Specifies the path to the ARC-56 or ARC-32 application.json file
- `-o, --output <path>` (required): Specifies the output file path for the generated TypeScript client
- `--pn, --preserve-names`: Preserve names from the application.json spec instead of sanitizing them to camelCase
- `-m, --mode <mode>`: Generate client in specified mode (default: `full`)
  - `full`: Generates a complete client with factory, deployment capabilities and all features
  - `minimal`: Generates a lightweight client without factory or deployment capabilities, resulting in a smaller output

#### CLI Examples

Generate a full client (default):

```bash
npx --yes @algorandfoundation/algokit-client-generator generate -a ./application.json -o ./client.ts
```

Generate a minimal client:

```bash
npx --yes @algorandfoundation/algokit-client-generator generate -a ./application.json -o ./client.ts -m minimal
```

#### Generation Modes

The generator supports two modes:

**Full Mode (default):**

- Includes factory class for creating and deploying smart contracts
- Includes deployment types and methods
- Includes all deployment-related metadata (source code, bytecode, template variables)
- Includes client class for interacting with already deployed contracts
- Best for development, deployment and interaction workflows or where output size is less important

**Minimal Mode:**

- Excludes factory class and deployment capabilities
- Excludes deployment-related metadata to reduce output size
- Only includes client class for interacting with already deployed contracts
- Best for scenarios that only need to interact with existing contracts

#### Programmatic API

Alternatively, a client can be generated from code by invoking the `generate` function paired with either `writeDocumentPartsToString` or `writeDocumentPartsToStream` depending on your needs. We also expose helpers to optionally load and validate an application.json file.

```ts
import fs from 'fs'
import {
  writeDocumentPartsToStream,
  writeDocumentPartsToString,
  generate,
  loadApplicationJson,
  validateApplicationJson,
} from '@algorandfoundation/algokit-client-generator'
import appJson from './application.json'

const appJsonFromFile = loadApplicationJson('./application.json')
const appJsonFromObject = validateApplicationJson(appJson)

const fileStream = fs.createWriteStream('./client.ts', {
  flags: 'w',
})
writeDocumentPartsToStream(generate(appJsonFromFile), fileStream)

// Generate a full client (default)
const clientAsString = writeDocumentPartsToString(generate(appJsonFromObject))

// Generate a minimal client
const minimalClientAsString = writeDocumentPartsToString(generate(appJsonFromObject, { mode: 'minimal' }))
```

For details on how to use the generated client see the more detailed [usage docs](./docs/usage.md)

## Code Examples

There are a range of [examples](./examples) that you can look at to see a source smart contract (e.g. `{contract.py}`), the generated client (`client.ts`) and some tests that demonstrate how you can use the client (`client.spec.ts`).

## Contributing

If you want to contribute to this project the following information will be helpful.

### Initial setup

1. Clone this repository locally
2. Install pre-requisites:

   - Install `AlgoKit` - [Link](https://github.com/algorandfoundation/algokit-cli#install): Ensure you can execute `algokit --version`.
   - Bootstrap your local environment; run `algokit bootstrap all` within this folder, which will:
     - Install `Poetry` - [Link](https://python-poetry.org/docs/#installation): The minimum required version is `1.2`. Ensure you can execute `poetry -V` and get `1.2`+
     - Run `poetry install` in the root directory, which will set up a `.venv` folder with a Python virtual environment and also install all Python dependencies
     - Run `npm install`

3. Open the project and start debugging / developing via:
   - VS Code
     1. Open the repository root in VS Code
     2. Install recommended extensions
     3. Run tests via test explorer
   - IDEA (e.g. PyCharm)
     1. Open the repository root in the IDE
     2. It should automatically detect it's a Poetry project and set up a Python interpreter and virtual environment.
     3. Run tests
   - Other
     1. Open the repository root in your text editor of choice
     2. Run `npm run test`

### Subsequently

1. If you update to the latest source code and there are new dependencies you will need to run `algokit bootstrap all` again
2. Follow step 3 above

### Building examples

In the `examples` folder there is a series of example contracts along with their generated client. These contracts are built using [Algorand Python](https://github.com/algorandfoundation/puya).

If you want to make changes to any of the smart contract examples and re-generate the ARC-0032 application.json files then change the corresponding `examples/{contract}/{contract}.py` file and then run:

```
poetry run python -m examples
```

Or in Visual Studio Code you can use the default build task (Ctrl+Shift+B).

To regenerate the generated clients run `npm run update-approvals`.

### Continuous Integration / Continuous Deployment (CI/CD)

This project uses [GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions) to define CI/CD workflows, which are located in the [`.github/workflows`](./.github/workflows) folder.

### Approval tests

Making any changes to the generated code will result in the approval tests failing. The approval tests work by generating a version of client
and outputting it to `./examples/APP_NAME/client.generated.ts` then comparing to the approved version `./examples/APP_NAME/client.ts`. If you
make a change and break the approval tests, you will need to update the approved version by overwriting it with the generated version.
You can run `npm run update-approvals` to update all approved clients in one go.
