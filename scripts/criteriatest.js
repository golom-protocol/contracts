// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
// require('@nomiclabs/hardhat-web3');

const types = {
    payment: [
        { name: 'paymentAmt', type: 'uint256' },
        { name: 'paymentAddress', type: 'address' }
    ],
    order: [
        { name: 'collection', type: 'address' },
        { name: 'tokenId', type: 'uint256' },
        { name: 'signer', type: 'address' },
        { name: 'orderType', type: 'uint256' },
        { name: 'totalAmt', type: 'uint256' },
        { name: 'exchange', type: 'payment' },
        { name: 'prePayment', type: 'payment' },
        { name: 'isERC721', type: 'bool' },
        { name: 'tokenAmt', type: 'uint256' },
        { name: 'refererrAmt', type: 'uint256' },
        { name: 'root', type: 'bytes32' },
        { name: 'reservedAddress', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
    ]
};

// fill bid function that takes, maker , taker , and amounts of all payments

// const contract = await MerkleProof.new();
const null_address = '0x0000000000000000000000000000000000000000';

async function main() {
    // console.log(hre.web3);
    // hre.web3.eth.abi.encodeParameter('uint256', '2345675643');
    // const leaves = [2, 3, 4, 5].map(v => keccak256(v));
    accounts = await hre.ethers.getSigners();
    const abi = hre.ethers.utils.defaultAbiCoder;
    let leaves = [];
    let leaf;
    for (let index = 0; index < 20; index++) {
        // console.log(index);
        leaf = hre.ethers.utils.solidityKeccak256(["address", "uint256"], [await accounts[index].getAddress(),200]);

        leaves.push(leaf);
    }
    
    // const leaves = [200, 300, 4, 5,6,7,8,9,10,11,12,13,114].map(v => keccak256(v));
    // console.log(params)
    console.log(leaves)
    const tree = new MerkleTree(leaves, keccak256, { sort: true });
    const root = tree.getHexRoot();
    // const leaf = keccak256(114);
    const abiencoded = hre.ethers.utils.solidityKeccak256(["address", "uint256"], [await accounts[18].getAddress(),200]);
    const leaf2 = abiencoded;
    console.log(abiencoded)
    // const proof = tree.getHexProof(leaf);
    const proof2 = tree.getHexProof(leaf2);
    console.log(proof2, root);
    console.log(tree.verify(proof2, leaf2, root));
    // address _token,
    // address _trader,
    // address _ve

    // console.log(root)
    // const Ve = await hre.ethers.getContractFactory('GolomAidrop');
    // const ve = await Ve.deploy(await accounts[9].getAddress(),await accounts[9].getAddress(),await accounts[9].getAddress());
    // console.log(await ve.address)

    // console.log(await ve.isMerkleRootSet())

    // await ve.setMerkleRoot(root);
    // console.log(await ve.isMerkleRootSet())

    // const d = await ve.canClaim(
    //     await accounts[18].getAddress(),
    //     200,
    //     proof2)

    // console.log(d)
    
    const root3 = "0x59947c719780ee4a9bc6ac246a07fa73ccb378647cf30208eb71af9c1b3039b8"

    const Ve = await hre.ethers.getContractFactory('GolomAidrop');
    const ve = await Ve.deploy(await accounts[9].getAddress(),await accounts[9].getAddress(),await accounts[9].getAddress());
    console.log(await ve.address)

    console.log(await ve.isMerkleRootSet())

    await ve.setMerkleRoot(root3);
    console.log(await ve.isMerkleRootSet())
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

    const d = await ve.canClaim(
        "0x61e5d7496cdc8cdce7a072595697f54fb5d505ef",
        amt,
        proof3)
    console.log(d)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
