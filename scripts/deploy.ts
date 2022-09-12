// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// import { ethers } from 'hardhat';

const hre = require('hardhat');

async function notmain() {
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
    const GENESIS_START_TIME = '1664654400'; // 25th May 2022, 00.00 AM GST

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

    const Airdrop = await hre.ethers.getContractFactory('GenesisClaim');
    const airdrop = await Airdrop.deploy(golomToken.address,golomTrader.address,voteEscrowDelegation.address);
    console.log("GenesisClaim:",await airdrop.address);

    const actualAirdrop = await hre.ethers.getContractFactory('GolomAidrop');
    const actualairdrop = await actualAirdrop.deploy(golomToken.address,golomTrader.address,voteEscrowDelegation.address);
    console.log("Golomairdrop:",await actualairdrop.address);

    const root3 = "0x59947c719780ee4a9bc6ac246a07fa73ccb378647cf30208eb71af9c1b3039b8"

    const root_airdrop = "0xde33f7df67166828cdcc2c107cf6a066fdc639a1c1f27efc1156b9d8bde88c79"

    await golomToken.mintAirdrop(airdrop.address)
    await golomToken.mintGenesisReward(actualairdrop.address)

    console.log(await actualairdrop.isMerkleRootSet())

    await actualairdrop.setMerkleRoot(root_airdrop);
    console.log(await actualairdrop.isMerkleRootSet())


    console.log(await airdrop.isMerkleRootSet())

    await airdrop.setMerkleRoot(root3);
    console.log(await airdrop.isMerkleRootSet())
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
notmain().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
