// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import {Ownable} from '../utils/Ownable.sol';
import {IERC20, SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract GolomTreasury is Ownable {
    IERC20 public golomToken;
    event Withdraw(address _to, uint256 _amount);

    constructor(address _governance, address _golomToken) {
        _transferOwnership(_governance);
        golomToken = IERC20(_golomToken);
    }

    /// @notice Withdraw Golom tokens
    /// @param _to Address to which the tokens should be withdrawan
    /// @param _amount Number of Golom tokens to be withdrawn
    function withdraw(address _to, uint256 _amount) external onlyOwner {
        golomToken.transfer(_to, _amount);
        emit Withdraw(_to, _amount);
    }
}
