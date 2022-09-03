// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// import { ethers } from 'hardhat';

const hre = require('hardhat');

async function main() {
    /**
     *  STEPS for Final Deployment
     *  1. deploy timelock
     */

    // deploy golom token
    // deploy vescrow
    // deploy reward distributor
    // deploy trader
    // set reward distributor on trader
    // set minter on golom token to reward distributor


    const GOVERNANCE = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const GENESIS_START_TIME = '1662321600'; // 25th May 2022, 00.00 AM GST

    const GolomTrader = await hre.ethers.getContractFactory('GolomTrader');
    const GolomToken = await hre.ethers.getContractFactory('GolomToken');
    const RewardDistributor = await hre.ethers.getContractFactory('RewardDistributor');

    const Lib = await hre.ethers.getContractFactory("TokenUriHelper");
    const lib = await Lib.deploy();
    await lib.deployed();

    const VoteEscrowDelegation = await hre.ethers.getContractFactory('VoteEscrow', {
        libraries: {
            TokenUriHelper: lib.address,
        },
      });

    const Weth = await hre.ethers.getContractFactory('WETH');
    const weth = await Weth.deploy();
  
    const golomTrader = await GolomTrader.deploy(GOVERNANCE,weth.address);
    const golomToken = await GolomToken.deploy(GOVERNANCE);

    const voteEscrowDelegation = await VoteEscrowDelegation.deploy(
        golomToken.address
    );

    const rewardDistributor = await RewardDistributor.deploy(
        weth.address,
        golomTrader.address,
        golomToken.address,
        GOVERNANCE,
        voteEscrowDelegation.address,
        GENESIS_START_TIME
    );

    await golomToken.setMinter(rewardDistributor.address);
    await golomTrader.setDistributor(rewardDistributor.address);

    await golomToken.mintAirdrop(rewardDistributor.address);
    await golomToken.mintGenesisReward(rewardDistributor.address);

    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        GolomTrader: golomTrader.address,
        GolomToken: golomToken.address,
        RewardDistributor: rewardDistributor.address,
        VeEscrow: voteEscrowDelegation.address,
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
