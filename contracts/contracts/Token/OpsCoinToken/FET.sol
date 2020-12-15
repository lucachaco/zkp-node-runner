pragma solidity >=0.5.7;

import "./OCT.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
 * @title Fungible dividend event token - ERC20 Token inherit OCT
 *
 * @dev Implementation of the FET.
 */
contract FET is OCT {
  using Address for address;
  using SafeMath for uint256;

  constructor (string memory name, string memory symbol, uint8 decimals, address initialAccount, uint256 initialBalance)
  OCT(name, symbol, decimals, initialAccount, initialBalance) public {
  }

  event Split(address indexed sender, address[] recipients, uint256[] nominators, uint256 denominator, uint256 amount);

  /**
   * @dev Public function that triggers an event for record keeping of split history
   * @param sender The account from which tokens are transferred out
   * @param recipients The account array for individual recipient.
   * @param numerators The share array for individual recipient.
   * @param denominator The share total. All nominators sum up to denominator.
   * @param total The actual share to be split.
   */
  function split(
    address sender,
    address[] calldata recipients,
    uint256[] calldata numerators,
    uint256 denominator,
    uint256 total
  ) external {
    require(recipients.length > 0, "empty recipient not allowed!");
    require(recipients.length == numerators.length, "recipients and numerators length not match!");

    uint256 verifyDenominator;
    for (uint256 i = 0; i < recipients.length; i++) {
      verifyDenominator = verifyDenominator.add(numerators[i]);
    }
    require(verifyDenominator == denominator, "fraction allocation is not correct!");

    emit Split(sender, recipients, numerators, denominator, total);
  }



}