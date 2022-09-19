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
let maker: any;
let taker: any;
let exchange: any;
let prepay: any;
let postpay: any;
let receiver: '0x0000000000000000000000000000000000000000';

let domain: any;

let genesisStartTime: number;

describe('RewardDistributor.sol', async () => {
    beforeEach(async () => {});

    accounts = await ethers.getSigners();
    maker = accounts[0];
    taker = accounts[1];
    exchange = accounts[2];
    prepay = accounts[3];
    postpay = accounts[4];
    governance = accounts[5];

    testErc20 = (await (await ERC20MockArtifacts).deploy()) as ERC20MockTypes;
    testErc721 = (await (await ERC721MockArtifacts).deploy()) as ERC721MockTypes;
    testErc1155 = (await (await ERC1155MockArtifacts).deploy()) as ERC1155MockTypes;
    weth = (await (await WETHArtifacts).deploy()) as WETHTypes;

    tokenUriHelper = await await tokenUriHelper.deploy();

    const VoteEscrowArtifacts = ethers.getContractFactory('VoteEscrow', {
        libraries: {
            TokenUriHelper: tokenUriHelper.address,
        },
    });

    voteEscrow = (await (await VoteEscrowArtifacts).deploy({
        libraries: {
            TokenUriHelper: tokenUriHelper.address,
        },
    })) as VoteEscrowTypes;
    golomToken = (await (await GolomTokenArtifacts).deploy(await governance.getAddress())) as GolomTokenTypes;

    timelock = (await (await TimelockArtifacts).deploy(await governance.getAddress(), 2)) as TimelockTypes;

    governerBravo = (await (await GovernerBravoArtifacts).deploy(
        timelock.address,
        voteEscrow.address,
        governance.getAddress(),
        voteEscrow.address
    )) as GovernorAlphaTypes;
});
