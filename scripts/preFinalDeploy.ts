import { ethers } from 'hardhat';

async function main() {
    const GOVERNANCE = ''; // external EOA

    const GOLOM_TOKEN = ''; // address of the GOLOM_TOKEN
    const WETH = '';
    const GENESIS_TIME = ''; // time to start genesis period
    const GOLOM_TRADER = ''; // address of the trader

    const VoteEscrow = await ethers.getContractFactory('VoteEscrow');
    const RewardDistributor = await ethers.getContractFactory('RewardDistributor');

    // Deploy VoteEscrow.sol
    const voteEscrow = await VoteEscrow.deploy(GOLOM_TOKEN);

    // Deploy RewardDistributor.sol
    const rewardDistributor = await RewardDistributor.deploy(WETH, GENESIS_TIME, GOLOM_TRADER, GOLOM_TOKEN, GOVERNANCE);

    // add voteEscrow in reward distributor
    await rewardDistributor.addVoteEscrow(voteEscrow.address); // REMEMBER: to call `executeAddVoteEscrow` after 1 days

    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        voteEscrow: voteEscrow.address,
        rewardDistributor: rewardDistributor.address,
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
