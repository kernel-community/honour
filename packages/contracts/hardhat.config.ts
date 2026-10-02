import { defineConfig, configVariable } from "hardhat/config";
import viem from "@nomicfoundation/hardhat-viem";
import tests from "@nomicfoundation/hardhat-node-test-runner";
import verify from "@nomicfoundation/hardhat-verify";

export default defineConfig({
  plugins: [viem, tests, verify],
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    hardhat: { type: "edr-simulated", chainType: "l1", chainId: 31337 },
    localhost: { type: "http", chainType: "l1", url: "http://127.0.0.1:8545", chainId: 31337 },
    mainnet: { type: "http", chainType: "l1", chainId: 1, url: configVariable("MAINNET_RPC_URL"), accounts: [] },
  },
  verify: { etherscan: { apiKey: configVariable("ETHERSCAN_API_KEY") } },
});
