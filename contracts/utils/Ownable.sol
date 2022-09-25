// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import '@openzeppelin/contracts/utils/Context.sol';

import 'hardhat/console.sol';

abstract contract Ownable is Context {
    address public owner;
    address public pendingOwner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Initialise the contract using msg.sender as the owner
    constructor() {
        _transferOwnership(_msgSender());
    }

    /// @notice Checks if the caller is the owner
    modifier onlyOwner() {
        require(owner == _msgSender(), 'Ownable: caller is not the owner');
        _;
    }

    /// @notice setup pending owner
    function changeOwner(address _newOwner) public onlyOwner {
        console.log('msg.sender', msg.sender);
        pendingOwner = _newOwner;
    }

    /// @notice new owner has to accept the ownership
    function acceptOwnership() public {
        require(pendingOwner == _msgSender(), 'not allowed');
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    /// @notice transfers the ownership
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}
