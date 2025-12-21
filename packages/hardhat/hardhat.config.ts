import { defineConfig } from "hardhat/config"

import "@nomicfoundation/hardhat-viem"
import "@nomicfoundation/hardhat-verify"

import * as dotenv from "dotenv"
dotenv.config({ path: ".env" })

const INFURA_API_KEY = process.env.INFURA_API_KEY ?? ""
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY ?? ""
const OP_PRIVATE_KEY = process.env.OP_PRIVATE_KEY ?? ""
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? ""

export default defineConfig({
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  networks: {
    hardhat: {
        type: "edr-simulated",
        chainId: 1337,
        mining: {
            auto: true,
            interval: 10_000,
        },
        allowUnlimitedContractSize: true,
        initialBaseFeePerGas: 0,
    },

    optimism: {
        type: "http",
        chainId: 10,
        url: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        accounts: OP_PRIVATE_KEY ? [OP_PRIVATE_KEY] : [],
    },

    mainnet: {
        type: "http",
        chainId: 1,
        url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
        accounts: MAINNET_PRIVATE_KEY ? [MAINNET_PRIVATE_KEY] : [],
    },
  },

  verify: {
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
 },
})
