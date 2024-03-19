require('@nomiclabs/hardhat-waffle')
require('hardhat-deploy')
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-etherscan')
require('hardhat-gas-reporter')
require('dotenv').config({ path: '.env' })

const INFURA_API_KEY = process.env.INFURA_API_KEY || ''
const MAINNET_PRIVATE_KEY =
    process.env.MAINNET_PRIVATE_KEY ||
    ''
const OP_PRIVATE_KEY =
    process.env.OP_PRIVATE_KEY ||
    ''
const GOERLI_PRIVATE_KEY =
    process.env.GOERLI_PRIVATE_KEY ||
    ''
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

task('accounts', 'Prints the list of accounts', async (hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

module.exports = {
  solidity: {
    version: '0.8.7',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  namedAccounts: {
    deployer: 0,
    creator: 1,
  },
  networks: {
    hardhat: {
      chainId: 1337,
      mining: {
        auto: true,
        interval: 10000
      },
      allowUnlimitedContractSize: true,
      initialBaseFeePerGas: 0 // https://github.com/sc-forks/solidity-coverage/issues/652
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY]
    },
    optimism: {
      url: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [OP_PRIVATE_KEY]
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [MAINNET_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 21
  }
}
