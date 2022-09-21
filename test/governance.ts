import { ethers, waffle } from 'hardhat';
import { BigNumber, utils, Signer, constants } from 'ethers';
import chai from 'chai';
const { expect } = chai;

// import artifacts
const GolomTraderArtifacts = ethers.getContractFactory('GolomTrader');
const RewardDistributorArtifacts = ethers.getContractFactory('RewardDistributor');
// const VoteEscrowArtifacts = ethers.getContractFactory('VoteEscrow');
const GolomTokenArtifacts = ethers.getContractFactory('GolomToken');
const GovernerBravoArtifacts = ethers.getContractFactory('GovernorAlpha');
const TimelockArtifacts = ethers.getContractFactory('Timelock');
const TokenUriHelper = ethers.getContractFactory('TokenUriHelper');

const ERC721MockArtifacts = ethers.getContractFactory('ERC721Mock');
const ERC1155MockArtifacts = ethers.getContractFactory('ERC1155Mock');
const ERC20MockArtifacts = ethers.getContractFactory('ERC20Mock');
const WETHArtifacts = ethers.getContractFactory('WETH');

// import typings
import { GolomTrader as GolomTraderTypes } from '../typechain/GolomTrader';
import { RewardDistributor as RewardDistributorTypes } from '../typechain/RewardDistributor';
import { VoteEscrow as VoteEscrowTypes } from '../typechain/VoteEscrow';
import { GolomToken as GolomTokenTypes } from '../typechain/GolomToken';

import { ERC721Mock as ERC721MockTypes } from '../typechain/ERC721Mock';
import { ERC1155Mock as ERC1155MockTypes } from '../typechain/ERC1155Mock';
import { ERC20Mock as ERC20MockTypes } from '../typechain/ERC20Mock';
import { WETH as WETHTypes } from '../typechain/WETH';
import { Timelock as TimelockTypes } from './../typechain/Timelock';
import { GovernorAlpha as GovernorAlphaTypes } from './../typechain/GovernorAlpha';

let testErc20: ERC20MockTypes;
let testErc721: ERC721MockTypes;
let testErc1155: ERC1155MockTypes;
let weth: WETHTypes;

let golomTrader: GolomTraderTypes;
let voteEscrow: VoteEscrowTypes;
let golomToken: GolomTokenTypes;
let rewardDistributor: RewardDistributorTypes;
let timelock: TimelockTypes;
let governerBravo: GovernorAlphaTypes;
let tokenUriHelper: any;

let accounts: Signer[];
let governance: Signer;
let userA: any;
let exchange: any;
let prepay: any;
let postpay: any;
let receiver: '0x0000000000000000000000000000000000000000';

let domain: any;

let genesisStartTime: number;

describe('RewardDistributor.sol', async () => {
    beforeEach(async () => {
        accounts = await ethers.getSigners();
        userA = accounts[0];
        exchange = accounts[2];
        prepay = accounts[3];
        postpay = accounts[4];
        governance = accounts[5];

        testErc20 = (await (await ERC20MockArtifacts).deploy()) as ERC20MockTypes;
        testErc721 = (await (await ERC721MockArtifacts).deploy()) as ERC721MockTypes;
        testErc1155 = (await (await ERC1155MockArtifacts).deploy()) as ERC1155MockTypes;
        weth = (await (await WETHArtifacts).deploy()) as WETHTypes;

        tokenUriHelper = await (await TokenUriHelper).deploy();

        const VoteEscrowArtifacts = ethers.getContractFactory('VoteEscrow', {
            libraries: {
                TokenUriHelper: tokenUriHelper.address,
            },
        });

        golomToken = (await (await GolomTokenArtifacts).deploy(await governance.getAddress())) as GolomTokenTypes;

        await golomToken.connect(governance).setMinter(await userA.getAddress());
        await golomToken.mint(await userA.getAddress(), toGwei(10000000));

        voteEscrow = (await (await VoteEscrowArtifacts).deploy(golomToken.address)) as VoteEscrowTypes;

        // remember: delay must be equal to or more than 2 days
        timelock = (await (await TimelockArtifacts).deploy(await governance.getAddress(), 172800)) as TimelockTypes;

        governerBravo = (await (await GovernerBravoArtifacts).deploy(
            timelock.address,
            voteEscrow.address,
            governance.getAddress(),
            voteEscrow.address
        )) as GovernorAlphaTypes;
    });

    describe('#general', () => {
        it('propose and vote', async () => {
            const tokenId = '1';

            // await golomToken.approve(voteEscrow.address, toGwei(1000));
            // await voteEscrow.create_lock(toGwei(1000), '86500');

            // const oldBlock = await getCurrentBlock();
            // const timestamp = oldBlock.timestamp;

            // console.log('oldBlock', oldBlock.number);

            // // await ethers.provider.send('hardhat_mine', ['0x3e8', '0x3c']);
            // // await ethers.provider.send('evm_setNextBlockTimestamp', [timestamp + 86500]);

            // const newBlock = await getCurrentBlock();
            // console.log('newBlock', newBlock.number);

            // console.log('voteEscrow totalSupply', await (await voteEscrow.totalSupply()).toString());

            // const getPriorVotes = await voteEscrow.getPriorVotes(tokenId, newBlock.number - 1);
            // const getVotes = await voteEscrow.balanceOfNFT(tokenId);

            // console.log('getPriorVotes', getPriorVotes);
            // console.log('getVotes', getVotes);

            const initialBlock = await getCurrentBlock();

            let i: number = 0;
            while (i < 30) {
                console.log({ i });
                let block;

                block = await getCurrentBlock();

                const MAXTIME = 4 * 365 * 86400;

                console.log(block.timestamp + 2, block.timestamp + MAXTIME);
                console.log(block.timestamp + 2 < block.timestamp + MAXTIME);

                await golomToken.approve(voteEscrow.address, toGwei(1000));
                await voteEscrow.create_lock(toGwei(1000), block.timestamp + 2);
                // await ethers.provider.send('evm_mine', [block.timestamp + 86400]);
            }

            // const balance = await voteEscrow.balanceOf(await userA.getAddress());
            // const ownerOf = await voteEscrow.ownerOf('1');
            // console.log(ownerOf, await userA.getAddress());

            // we're changing owner of the GolomToken
            // change governance to GovernerAlpha
            // await golomToken.changeOwner(governerBravo.address);

            // const proposalThreshold = await governerBravo.proposalThreshold();
            // console.log({ proposalThreshold: proposalThreshold.toString() });

            // // to change the governance successfullt we need to accept the owner from Bravo
            // const targets = [golomToken.address];
            // const values = ['0'];
            // const signatures = ['getBalanceOf(address)'];
            // const callDatas = [encodeParameters(['address'], [userA.address])];
            // const description = 'Test Proposal 1';

            // await governerBravo.propose(tokenId, targets, values, signatures, callDatas, description);
        });
    });

    // uint256 tokenId,
    // address[] memory targets,
    // uint256[] memory values,
    // string[] memory signatures,
    // bytes[] memory calldatas,
    // string memory description
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
