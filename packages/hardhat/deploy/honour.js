module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    let { deployer } = await getNamedAccounts()

    const network = await hre.ethers.provider.getNetwork()
    console.log(`network: ${network.name}`)

    const token = await deploy('ERC20', {
        from: deployer,
        args: ["Honour", "HON", 18]
    });

    console.log("Token address:", token.address);

    await deploy('Honour', {
      from: deployer,
      args: [token.address],
      log: true
    })
  }
  module.exports.tags = ['Honour']
  