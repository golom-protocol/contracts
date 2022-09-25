// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// import { ethers } from 'hardhat';

const hre = require('hardhat');

async function notmain() {
    const GOVERNANCE = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const GENESIS_START_TIME = '1664654400'; // 25th May 2022, 00.00 AM GST
    const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

    const GolomTrader = await hre.ethers.getContractFactory('GolomTrader');
    const Emitter = await hre.ethers.getContractFactory('Emitter');
    const GolomToken = await hre.ethers.getContractFactory('GolomToken');
    const RewardDistributor = await hre.ethers.getContractFactory('RewardDistributor');
    const GenesisClaim = await hre.ethers.getContractFactory('GenesisClaim');
    const GolomAirdrop = await hre.ethers.getContractFactory('GolomAirdrop');
    const GovernerBravo = await hre.ethers.getContractFactory('GovernorAlpha');
    const Timelock = await hre.ethers.getContractFactory('Timelock');

    // Deploy TokenURI Helper required for VE Delegation
    const Lib = await hre.ethers.getContractFactory('TokenUriHelper');
    const lib = await Lib.deploy();
    await lib.deployed();

    const VoteEscrowDelegation = await hre.ethers.getContractFactory('VoteEscrow', {
        libraries: {
            TokenUriHelper: lib.address,
        },
    });

    const golomTrader = await GolomTrader.deploy(GOVERNANCE, WETH);
    console.log(`🎉 GolomTrader.sol: ${golomTrader.address}`);

    const emitter = await Emitter.deploy(golomTrader.address);
    console.log(`🎉 Emitter.sol: ${emitter.address}`);

    const golomToken = await GolomToken.deploy(GOVERNANCE);
    console.log(`🎉 GolomToken.sol: ${golomToken.address}`);

    const voteEscrowDelegation = await VoteEscrowDelegation.deploy(golomToken.address);
    console.log(`🎉 VoteEscrowDelegation.sol: ${voteEscrowDelegation.address}`);

    const rewardDistributor = await RewardDistributor.deploy(
        WETH,
        golomTrader.address,
        golomToken.address,
        GOVERNANCE,
        voteEscrowDelegation.address,
        GENESIS_START_TIME
    );
    console.log(`🎉 RewardDistributor.sol: ${rewardDistributor.address}`);

    await golomToken.setMinter(rewardDistributor.address);
    console.log(`✅ Add rewardDistributor.addresss as minter to GolomToken.sol`);

    await golomTrader.setDistributor(rewardDistributor.address);
    console.log(`✅ Set reward distributor in the GolomTrader.sol`);

    const genesisClaim = await GenesisClaim.deploy(
        golomToken.address,
        golomTrader.address,
        voteEscrowDelegation.address
    );
    console.log('🎉 GenesisClaim:', await genesisClaim.address);

    const golomAirdrop = await GolomAirdrop.deploy(
        golomToken.address,
        golomTrader.address,
        voteEscrowDelegation.address
    );
    console.log('🎉 Golomairdrop:', await golomAirdrop.address);

    const geneisClaimRoot = '0x59947c719780ee4a9bc6ac246a07fa73ccb378647cf30208eb71af9c1b3039b8';

    const airdropRoot = '0xde33f7df67166828cdcc2c107cf6a066fdc639a1c1f27efc1156b9d8bde88c79';

    await golomToken.mintAirdrop(genesisClaim.address);
    console.log(`✅ Mint airdrop to GenesisClaim contract`);

    await golomToken.mintGenesisReward(golomAirdrop.address);
    console.log(`✅ Mint genesis reward to GolomAirdrop contract`);

    await golomAirdrop.setMerkleRoot(airdropRoot);
    console.log(`✅ Set MerkleRoot for golomAidrop`);

    await genesisClaim.setMerkleRoot(geneisClaimRoot);
    console.log(`✅ Set MerkleRoot for geneisClaim`);

    const timelock = await Timelock.deploy(GOVERNANCE, 172800);
    console.log('🎉 Timelock:', await genesisClaim.address);

    const governerBravo = await GovernerBravo.deploy(
        timelock.address,
        voteEscrowDelegation.address,
        GOVERNANCE,
        voteEscrowDelegation.address
    );
    console.log('🎉 GovernerBravo:', await genesisClaim.address);

    console.log(`================================================================================== `);

    console.log(`🎉🎉🎉 Deployment Successful 🎉🎉🎉 `);
    console.log({
        Emitter: emitter.address,
        GolomTrader: golomTrader.address,
        GolomToken: golomToken.address,
        RewardDistributor: rewardDistributor.address,
        VoteEscrow: voteEscrowDelegation.address,
        GenesisAidrop: golomAirdrop.address,
        GenesisClaim: genesisClaim.address,
        Timelock: timelock.address,
        GovernerBravo: governerBravo.address,
    });

    console.log(`================================================================================== `);

    // we need to set GovernerBravo as the admin of timelock to make it function.
    const setTimlockAdmin = {
        targets: timelock.address,
        values: '0',
        signatures: 'setPendingAdmin(address)',
        callDatas: encodeParameters(['address'], [governerBravo.address]),
        eta: (await (await getCurrentBlock()).timestamp) + 172900,
    };

    console.log({
        setTimlockAdmin,
    });

    // considering the previously added EOA is calling this function, we need to store the parameters as we'll be requiring
    // it afterwards to execute the trasnaction
    await timelock.queueTransaction(
        setTimlockAdmin.targets,
        setTimlockAdmin.values,
        setTimlockAdmin.signatures,
        setTimlockAdmin.callDatas,
        setTimlockAdmin.eta
    );

    // after 2 days we'll need to call executeTransaction and then call the accept admin as written in the tests
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
notmain().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

function encodeParameters(types: any, values: any) {
    const abi = new ethers.utils.AbiCoder();
    return abi.encode(types, values);
}

const toGwei = (_number: any) => {
    return (_number * 1e18).toLocaleString('fullwide', { useGrouping: false });
};

async function getCurrentBlock() {
    const blockNumber = await ethers.provider.getBlockNumber();
    return await ethers.provider.getBlock(blockNumber);
}
