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
const GolomTreasuryArtifacts = ethers.getContractFactory('GolomTreasury');

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
import { GolomTreasury as GolomTreasuryTypes } from './../typechain/GolomTreasury';

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
let golomTreasury: GolomTreasuryTypes;

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

        // to change the governance successfullt we need to accept the owner from Bravo

        const setTimlockAdmin = {
            targets: timelock.address,
            values: '0',
            signatures: 'setPendingAdmin(address)',
            callDatas: encodeParameters(['address'], [governerBravo.address]),
            eta: (await (await getCurrentBlock()).timestamp) + 172900,
        };

        await timelock
            .connect(governance)
            .queueTransaction(
                setTimlockAdmin.targets,
                setTimlockAdmin.values,
                setTimlockAdmin.signatures,
                setTimlockAdmin.callDatas,
                setTimlockAdmin.eta
            );

        await ethers.provider.send('evm_mine', [(await (await getCurrentBlock()).timestamp) + 3 * 86400]);

        await timelock
            .connect(governance)
            .executeTransaction(
                setTimlockAdmin.targets,
                setTimlockAdmin.values,
                setTimlockAdmin.signatures,
                setTimlockAdmin.callDatas,
                setTimlockAdmin.eta
            );

        await governerBravo.connect(governance).__acceptAdmin();

        golomTreasury = (await (await GolomTreasuryArtifacts).deploy(
            timelock.address,
            golomToken.address
        )) as GolomTreasuryTypes;
    });

    describe('#general', () => {
        it('propose and vote', async () => {
            const tokenId = '2';

            const initialBlock = await getCurrentBlock();

            let i: number = 0;
            while (i < 30) {
                console.log({ i });
                let block;

                block = await getCurrentBlock();

                await golomToken.approve(voteEscrow.address, toGwei(10000));
                const lockTx = await voteEscrow.create_lock(toGwei(10000), 10 * 604800);
                const receipt = await lockTx.wait();

                let abi = ['event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'];
                let iface = new ethers.utils.Interface(abi);
                let log = iface.parseLog(receipt.logs[0]); // here you can add your own logic to find the correct log
                const { from, to, tokenId } = log.args;

                await ethers.provider.send('evm_mine', [block.timestamp + 10 * 86400]);

                await voteEscrow.delegate(tokenId, 2);

                i++;
            }

            const balance = await voteEscrow.balanceOf(await userA.getAddress());
            const ownerOf = await voteEscrow.ownerOf('1');
            console.log(ownerOf, await userA.getAddress());

            const proposalThreshold = await governerBravo.proposalThreshold();

            console.log({ proposalThreshold: proposalThreshold.toString() });
            const totalSupply = (await voteEscrow.totalSupply()).toString();
            console.log('voteEscrow totalSupply', totalSupply);
            console.log('1% of totalSupply', parseInt(totalSupply) / 100);

            const currentBlock = await getCurrentBlock();

            console.log('balance of user', await voteEscrow.getPriorVotes('2', currentBlock.number - 1));

            // to change the governance successfullt we need to accept the owner from Bravo

            const newPendingOwner = await userA.getAddress();
            console.log({ newPendingOwner });

            const targets = [golomTreasury.address];
            const values = ['0'];
            const signatures = ['changeOwner(address)'];
            const callDatas = [encodeParameters(['address'], [newPendingOwner])];
            const description = 'Change Owner of Golom Token';

            const proposeTx = await (
                await governerBravo.propose(tokenId, targets, values, signatures, callDatas, description)
            ).wait();

            const proposalId = new ethers.utils.Interface(ProposalCreatedEventABI)
                .parseLog(proposeTx.logs[0])
                .args.id.toString();

            // make the proposal in active state
            await ethers.provider.send('hardhat_mine', [utils.hexValue(1000)]);

            // caste vote
            await governerBravo.castVote(tokenId, proposalId, true);

            console.log('latest block', (await getCurrentBlock()).number);

            // end the voting duration
            await ethers.provider.send('hardhat_mine', [utils.hexValue(17000)]);

            // queue the voting (cannot do in same block hence increasing)
            await ethers.provider.send('hardhat_mine', [utils.hexValue(1000)]);
            await governerBravo.connect(governance).queue(proposalId);

            // execute the proposal, need to surpass timelock
            await ethers.provider.send('hardhat_mine', [utils.hexValue(1)]);
            await ethers.provider.send('evm_mine', [(await getCurrentBlock()).timestamp + 3 * 172800]);
            console.log('executing now');
            await governerBravo.connect(governance).execute(proposalId);

            let proposalState;
            proposalState = await governerBravo.state(proposalId);

            console.log({ proposalState });

            expect(await golomTreasury.pendingOwner()).to.be.equals(await userA.getAddress());
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
    console.log({
        valiess: values,
    });
    const abi = new ethers.utils.AbiCoder();
    console.log(abi.encode(types, values));
    return abi.encode(types, values);
}

const toGwei = (_number: any) => {
    return (_number * 1e18).toLocaleString('fullwide', { useGrouping: false });
};

async function getCurrentBlock() {
    const blockNumber = await ethers.provider.getBlockNumber();
    return await ethers.provider.getBlock(blockNumber);
}

const ProposalCreatedEventABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'id',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'proposer',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address[]',
                name: 'targets',
                type: 'address[]',
            },
            {
                indexed: false,
                internalType: 'uint256[]',
                name: 'values',
                type: 'uint256[]',
            },
            {
                indexed: false,
                internalType: 'string[]',
                name: 'signatures',
                type: 'string[]',
            },
            {
                indexed: false,
                internalType: 'bytes[]',
                name: 'calldatas',
                type: 'bytes[]',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'startBlock',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'endBlock',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'description',
                type: 'string',
            },
        ],
        name: 'ProposalCreated',
        type: 'event',
    },
];
