const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Honour', function () {
    beforeEach(async function () {
        const Honour = await ethers.getContractFactory('Honour')
        const ERC20 = await ethers.getContractFactory('ERC20')
        const [deployer, alice] = await ethers.getSigners()
        this.deployer = deployer
        this.alice = alice
        this.token = await ERC20.deploy("Honour", "HON", 18)
        this.honour = await Honour.deploy(this.token.address)
    })

    describe('Token', function () {
        it('has correct name and symbol', async function () {
            expect(await this.token.name()).to.equal('Honour')
            expect(await this.token.symbol()).to.equal('HON')
        })
    })    
})