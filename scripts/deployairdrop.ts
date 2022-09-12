// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
// import { ethers } from 'hardhat';
// const hre = require('hardhat');
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
    await golomToken.mintGenesisReward(actualairdrop.address)

    console.log(await actualairdrop.isMerkleRootSet())

    await actualairdrop.setMerkleRoot(root_airdrop);
    console.log(await actualairdrop.isMerkleRootSet())


    console.log(await airdrop.isMerkleRootSet())

    await airdrop.setMerkleRoot(root3);
    console.log(await airdrop.isMerkleRootSet())
    const proof3 = [
        "0x87bf302644e3481e0bde848f7ab763c09ff45316234948f23c51c5a905aa8643",
        "0x9fd2f874ef838eba5b6790783d9ffaca416d7dad5c482ccfb7f4b72cdd038930",
        "0x0f20acaa50a2e7194ddedf48a06517f1838799061d757a94431e51187957142b",
        "0x793bd5b29aeea1840dcaa59ee71babbcb7c67a80e4fa2bb24a9b18ae6d6caf34",
        "0xdd62d3181eb73fe7ee21c1176366ee520089c811951fc9ba2b10544bf2780ebc",
        "0x24da1d9d9bd77037df1d186613783f0d60cc37d22409aaa191b5cf70cfb2c569",
        "0x9320e4d3887e10121b462155009251a76a32768adef19f174aae066e53dfe39e",
        "0x45f0d2dafe3158bf9f0db3a67272829346b6aa183e282252b9195d6a04bd41dc",
        "0xf912a73e2a8f55d5c9af8946669fdf27deb2a281c6735fd4c74388ef1afec3b7",
        "0x90d10c98d5ac8a733d8512d49c27aa7ea8154768909146186ea5a4848ac47eda",
        "0x288df5baa33f07c2f762bb5855d3ef48f10f56b12952e88cbd8a269dbf648564",
        "0x600350654e9f3c0b55c227db0a9e282c312af4da96ed9afc701c8d3f2bf0b967",
        "0x72e9b89f5490eb508e9f7b8da57c3b7f820a9eaf201faf2eff1d91610c24db9b",
        "0x2a86930ba00ba697df1aadfb25533260ea3b63b9e870b5433eaa84b3477d3fa6",
        "0xca1d7b0a079d99b5e08cbe00631c434d8d81944a7d9f2798936ba01ca1dd05d0",
        "0xe521685009ce88762d7c244d8eb487bab3acc3e74d7e92d210b3f0c6eb659dce",
        "0x837dbdfc6415748ad544ab1e0f02f0ee07e1dd754a710f4d3c53dcae6b56e416"
        ]
    console.log(proof3)
    const amt = hre.ethers.utils.parseEther("500")
    const abiencoded2 = hre.ethers.utils.solidityKeccak256(["address", "uint256"], ["0x74b71fd62b7c8c72f1c5cf5c15321967744cf465",amt]);
    console.log(abiencoded2)

    const d = await actualairdrop.canClaim(
        "0x74b71fd62b7c8c72f1c5cf5c15321967744cf465",
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