# Contributing

A full guide on how to contribute to LINAW.

## Issues

1. Verify if your [issue](https://github.com/JedEatSnax/LINAW/issues) is already mentioned to avoid duplication.
2. Open an issue using GitHub's [bug report](ISSUE_TEMPLATE/bug_report.md) or [feature request](ISSUE_TEMPLATE/feature_request.md) template.
3. Please note if the issue is identified by a human or an LLM.

## Local Testing

Copy and paste the [client](../client/.env.example) and [server](../server/.env.example) example environemt variables into your own `client/.env.local` and `server/.env.local` files.

### Client Development

```shell
cd client
pnpm install
pnpm run dev
```

---

### Server Development

#### Installation

```shell
cd server
pnpm install
pnpm run dev
```

#### Testing

There are no unit tests for the server directory yet.

```shell
pnpm run typecheck
pnpm run lint
pnpm run trace
```

#### Solidity Development with Hardhat 3 + Ethers + Mocha + Solhint

The server directory uses the Mocha and Ethers boilerplate. Learn more at the [official Hardhat 3 documentation](https://hardhat.org/docs/getting-started). This boilerplate provides agent skills for [hardhat](skills/hardhat/SKILL.md) and [hardhat-toolbox-mocha-ethers](skills/hardhat-toolbox-mocha-ethers/SKILL.md).

To run all the tests in the project, execute the following command:

```shell
pnpm hardhat test
```

You can also selectively run the Solidity or `mocha` tests:

```shell
pnpm hardhat test solidity
pnpm hardhat test mocha
```

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to Ethereum Sepolia.

To run the deployment to a local chain:

```shell
pnpm hardhat ignition deploy ignition/modules/Counter.ts
```

To run the deployment to Sepolia, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `SEPOLIA_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `SEPOLIA_PRIVATE_KEY` variable using the `hardhat-keystore` plugin or by setting it as an environment variable.

To set the `SEPOLIA_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
pnpm hardhat keystore set SEPOLIA_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the Sepolia network:

```shell
pnpm hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```

Additionally, production Solidity contracts must use the [NatSpec Format](https://docs.soliditylang.org/en/stable/natspec-format.html). Also known as Ethereum Natural Language Specification Format, it is a special form of comments that provides rich documentation for functions, return variables, and more. Read more at the [official Protofire Solhint](https://protofire.github.io/solhint/) documentation.

To lint all the files within the `server/contracts` directory

```shell
cd server
pnpm solhint 'contracts/*.sol'
```

To lint a specific file within the `server/contracts` directory

```shell
cd server
pnpm solhint contracts/File.sol
```

#### Prisma ORM Development

To get started with Prisma ORM development while using the existing schema:

```shell
pnpm run generate
```

**_Unfinished_**
