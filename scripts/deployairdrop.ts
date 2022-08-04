// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// import { ethers } from 'hardhat';
const hre = require('hardhat');
const ethers = hre.ethers
async function main() {
    /**
     *  STEPS for Final Deployment
     *  1. deploy timelock
     */

    const GOVERNANCE = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

    const GolomTrader = await ethers.getContractFactory('GolomTrader');
    const GolomToken = await ethers.getContractFactory('GolomToken');
    const RewardDistributor = await ethers.getContractFactory('RewardDistributor');
    const Weth = await ethers.getContractFactory('WETH');
    const weth = await Weth.deploy();
    const signers = await ethers.getSigners();

    const Lib = await ethers.getContractFactory("TokenUriHelper");
    const lib = await Lib.deploy();
    await lib.deployed();

    const contractFactory = await ethers.getContractFactory("VoteEscrow", {
      signer: signers[0],
      libraries: {
        TokenUriHelper: lib.address,
      },
    });
    // const VoteEscrow = await ethers.getContractFactory('VoteEscrow');
    const golomTrader = await GolomTrader.deploy(GOVERNANCE);
    const golomToken = await GolomToken.deploy(GOVERNANCE);

    // Deploy VoteEscrow.sol
    const voteEscrow = await contractFactory.deploy(golomToken.address);

    // Deploy RewardDistributor.sol
    const rewardDistributor = await RewardDistributor.deploy(weth.address, golomTrader.address, golomToken.address, GOVERNANCE);

    // add voteEscrow in reward distributor
    console.log('⏳ Adding VoteEscrow to RewardDistributor');

    await rewardDistributor.addVoteEscrow(voteEscrow.address);
    console.log('✅ Added VoteEscrow to RewardDistributor Succcessfully!');

    console.log('⏳ Adding RewardDistributor to GolomToken');
    await golomToken.setMinter(rewardDistributor.address);
    console.log('✅ Added RewardDistributor to GolomToken Succcessfully!');

    console.log('⏳ Adding RewardDistributor to GolomTrader');
    await golomTrader.setDistributor(rewardDistributor.address);
    console.log('✅ Added RewardDistributor to GolomTrader Succcessfully!');

    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        voteEscrow: voteEscrow.address,
        rewardDistributor: rewardDistributor.address,
    });
    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        voteEscrow: voteEscrow.address,
        rewardDistributor: rewardDistributor.address,
    });

    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        GolomTrader: golomTrader.address,
        GolomToken: golomToken.address,
        RewardDistributor: rewardDistributor.address,
    });


    const Airdrop = await ethers.getContractFactory('GenesisClaim');
    const airdrop = await Airdrop.deploy(golomToken.address,golomTrader.address,voteEscrow.address);
    console.log("GenesisClaim:",await airdrop.address);

    const actualAirdrop = await ethers.getContractFactory('GolomAidrop');
    const actualairdrop = await actualAirdrop.deploy(golomToken.address,golomTrader.address,voteEscrow.address);
    console.log("Golomairdrop:",await actualairdrop.address);

    const root3 = "0x59947c719780ee4a9bc6ac246a07fa73ccb378647cf30208eb71af9c1b3039b8"

    const root_airdrop = "0xde33f7df67166828cdcc2c107cf6a066fdc639a1c1f27efc1156b9d8bde88c79"

    await golomToken.mintAirdrop(airdrop.address)
    await golomToken.mintGenesisReward(actualAirdrop.address)

    console.log(await actualairdrop.isMerkleRootSet())

    await actualairdrop.setMerkleRoot(root_airdrop);
    console.log(await actualairdrop.isMerkleRootSet())


    console.log(await airdrop.isMerkleRootSet())

    await airdrop.setMerkleRoot(root3);
    console.log(await airdrop.isMerkleRootSet())
    const proof3 = [
        '0xf6e1fc995aea35caed4af192774a2d7f11cf422f7f0141071e4776ebc0f1d39e',
        '0xe9d333a836733bd7c62683827b784be8918f5d2f1f47f8cd3e909a247503003b',
        '0x1b96b359460ddb4ca7aaf475d92c942e046c203c7f9d3e6e0e5d9f656f07b23c',
        '0xb13b5adb6c22ca2e1f94dc0ee1236857868129cea2936c9e2f5ad10ceb2d57ce',
        '0x380992f70d6dbc2e06b270bfb01cf3a9746a40b22c3dd2186139114a11a6237d'
      ]
    console.log(proof3)
    const amt = hre.ethers.utils.parseEther("0.1952")
    const abiencoded2 = hre.ethers.utils.solidityKeccak256(["address", "uint256"], ["0x61e5d7496cdc8cdce7a072595697f54fb5d505ef",amt]);
    console.log(abiencoded2)

    const d = await airdrop.canClaim(
        "0x61e5d7496cdc8cdce7a072595697f54fb5d505ef",
        amt,
        proof3)
    console.log(d)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});