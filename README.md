# Honour

Money, made mutual. HON represents obligation, created by accepting someone’s proposal and extinguished by accepting forgiveness. [Read the full essay](https://www.kernel.community/en/tokens/token-studies/honour).

## Project

- `packages/contracts`: Solidity contracts, Hardhat deployment tools, shared ABI.
- `packages/indexer`: a small geth-backed indexer and authenticated API using SQLite.
- `packages/web`: the Next.js app.
- `scripts/bundle-indexer.mjs`: builds the indexer as a standalone Node module.

## Development

Use Node 22.13+ (22.x) and pnpm 10.26.2.

```sh
pnpm install
pnpm contracts:build
pnpm dev
```

Open http://127.0.0.1:3000. Copy `packages/web/.env.example` to `.env.local` in that directory and configure the server-only variables. Without credentials, the interface is available but account actions are disabled. Never put secrets in `NEXT_PUBLIC_*` variables.

```sh
pnpm test
pnpm typecheck
pnpm build
```

For a local chain, run `pnpm node`, then `pnpm deploy:local`. The deployment is recorded in `packages/contracts/deployments/31337.local.json`. Copy `packages/indexer/.env.example` to `.env`, set the local contract address, deployment block, `CHAIN_ID=31337` and a random `INDEXER_TOKEN`, then run `pnpm indexer`. Set matching values in the web environment, with `INDEXER_URL=http://127.0.0.1:8787`.

Smart-account writes use Ethereum mainnet. To exercise all four actions on the local test chain instead:

```sh
pnpm --filter @honour/contracts exec tsx scripts/smoke-local.ts
```

## Indexer

The indexer reads only the configured Honour contract, starting at its deployment block. It indexes the latest head, saving events and the cursor atomically and deduplicating logs. Trust scores use complete indexed histories and are relative to the viewer.

Run from source with `pnpm indexer`, or build a standalone bundle:

```sh
pnpm indexer:bundle
node --env-file=/path/to/indexer.env packages/indexer/dist/indexer.mjs
```

The bundle needs Node 22.13+ (22.x), with no npm install on the host. Configure it using `packages/indexer/.env.example`. SQLite defaults to a 256 MiB ceiling and requires at least 128 MiB of free disk space. The API binds to loopback and requires `INDEXER_TOKEN`.

Keep geth RPC private. Use an SSH tunnel for local development or an authenticated HTTPS reverse proxy for a hosted app. If a reorg requires rebuilding derived history, stop the indexer, run `pnpm --filter @honour/indexer rebuild` with the same environment, then restart it. This does not change geth data.

## Web deployment

For Vercel, set the Root Directory to `packages/web` and include files outside that directory for the shared contracts package. Configure the variables in `packages/web/.env.example` as server-only environment variables.

Alchemy account requests go through the app’s server routes. Enable Ethereum mainnet and configure per-account and global spending limits, then set `SPONSORSHIP_LIMITS_CONFIGURED=true`. The app’s server route restricts prepared calls to the Honour contract and its four supported actions. Alchemy’s sender allowlist identifies smart accounts, not destination contracts; provider-side contract restrictions require a custom policy webhook. Keep the API key and policy server-side. Preview deployments should use separate limits or omit wallet credentials.

Wallet addresses and ENS names resolve to the same smart account used when their owner connects. Receiving links preserve the recipient’s Honour address. Prepared operations are sealed server-side so signed submissions cannot alter their approved contents.

## Contract deployment

Provide `MAINNET_RPC_URL` and a dedicated funded `DEPLOYER_PRIVATE_KEY` in the deployment shell. These are local deployment secrets, not Vercel variables. Never commit a key or unlock a node account.

```sh
pnpm deploy:mainnet
```

The script checks chain 1, requests confirmation and records the transaction, address and deployment block in `packages/contracts/deployments/mainnet.json`. An existing deployment record prevents accidental redeployment. Configure the web app and indexer with the same address and start the indexer from its deployment block. Rebuild the shared ABI whenever contracts change.

For Etherscan verification, provide `ETHERSCAN_API_KEY` and run:

```sh
pnpm --filter @honour/contracts exec hardhat verify --network mainnet DEPLOYED_ADDRESS
```

Local operations notes and deployment helpers live in the ignored `ops/` directory and are not required to build or run the project.
