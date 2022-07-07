import { ethers } from 'hardhat';

async function main() {
    const GOVERNANCE = ''; // external EOA

    const TIMLOCK_DELAY = ''; // time delay for the timelock
    const VOTE_ESCROW = ''; // address of the the escroe

    const Timelock = await ethers.getContractFactory('Timelock');
    const GovernerBravo = await ethers.getContractFactory('GovernorAlpha');

    const timelock = await Timelock.deploy(GOVERNANCE, TIMLOCK_DELAY);
    const governerBravo = await GovernerBravo.deploy(timelock.address, VOTE_ESCROW, GOVERNANCE, VOTE_ESCROW);

    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        timelock: timelock.address,
        governerBravo: governerBravo.address,
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
