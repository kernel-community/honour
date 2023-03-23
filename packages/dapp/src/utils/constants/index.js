import { abis } from './abi'

export const addresses = {
  chainIdToContractAddresses: (chainId) => {
    switch (chainId) {
      case 1337:
        return {
          ERC20: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          Honour: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
        }
      case 5:
        return {
          ERC20: '0xd67Da31889E1EC7423cab31c68cD6D3FE1fc6D00',
          Honour: '0x80c25Df6014253FE78f4Ec6258F73855dEe09A6c'
        }
      default:
        return {
          ERC20: '0xd67Da31889E1EC7423cab31c68cD6D3FE1fc6D00',
          Honour: '0x80c25Df6014253FE78f4Ec6258F73855dEe09A6c'
        }
    }
  }
}
export { abis }

export const etherscan = {
  chainIdToUrl: (id) => {
    switch (id) {
      case 5: return 'https://goerli.etherscan.io'
      default: return 'https://etherscan.io'
    }
  }
}

export const graph = {
  baseURL: 'https://api.studio.thegraph.com/query/24825/honour-goerli/0.1.1'
}

export const twitter = {
  shareIntent: 'https://twitter.com/intent/tweet?text=',
  shareContent: 'This weird money changes the meaning of value, if we trust each other.'
}
