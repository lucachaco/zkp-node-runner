pragma solidity >=0.5.7;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "./ERC20.sol";
import "./IOCTReceiver.sol";


/**
 * @title OpsCoin token - ERC20 Token with callback function on SafeTransferToContract
 *
 * @dev Implementation of the OpsCoin token.
 */
contract OCT is ERC20Detailed, ERC20 {
  using Address for address;
  address private _beneficiary;

  bytes4 private constant _OCT_RECEIVED = 0x1e7aa84b;

  constructor (string memory name, string memory symbol, uint8 decimals, address initialAccount, uint256 initialBalance)
  ERC20Detailed(name, symbol, decimals) public {
    _beneficiary = initialAccount;
    _mint(initialAccount, initialBalance);
  }

  /**
    * @dev Safely transfers the ownership of a given token ID to another address
    * If the target address is a contract, it must implement `onERC20Received`,
    * which is called upon a safe transfer, and return the magic value
    * `bytes4(keccak256("onOCTReceived(address,address,uint256,bytes)"))`; otherwise,
    * the transfer is reverted.
    * Requires the msg sender to be the owner, approved, or operator
    * @param from current owner of the token
    * @param to address to receive the ownership of the given token ID
    * @param amount uint256 of tokens to be transferred
    * @param _data bytes data to send along with a safe transfer check
    */
  function safeTransferFrom(address from, address to, uint256 amount, bytes memory _data) public {
    if (msg.sender == from) {
      super._transfer(from, to, amount);
    } else {
      super.transferFrom(from, to, amount);
    }
    require(_checkOnOCTReceived(from, to, amount, _data), "_checkOnOCTReceived didn't return true");
  }

  /**
    * @dev Internal function to invoke `onOCTReceived` on a target address
    * The call is not executed if the target address is not a contract
    * @param from address representing the previous owner of the given token ID
    * @param to target address that will receive the tokens
    * @param amount uint256 of tokens to be transferred
    * @param _data bytes optional data to send along with the call
    * @return whether the call correctly returned the expected magic value
    */
  function _checkOnOCTReceived(address from, address to, uint256 amount, bytes memory _data)
    internal returns (bool)
  {
    if (!to.isContract()) {
      return true;
    }

    bytes4 retval = IOCTReceiver(to).onOCTReceived(msg.sender, from, amount, _data);
    return (retval == _OCT_RECEIVED);
  }

  function mint(address account, uint256 amount) public {
    _mint(account, amount);
  }

  /**
   * @dev Public function that burns an amount of the token of a given
   * account.
   * @param account The account whose tokens will be burnt.
   * @param value The amount that will be burnt.
   */
  function burn(address account, uint256 value) public {
    super._burn(account, value);
  }

  /**
   * @dev Public function that burns an amount of the token of a given
   * account.
   * @param account The account whose tokens will be burnt.
   * @param value The amount that will be burnt.
   */
  function burnFrom(address account, uint256 value) public {
    super._burnFrom(account, value);
  }

  function release(address from) public {
      //TODO: add responseDate check
      uint256 amount = balanceOf(from);
      _forceTransferFrom(from, _beneficiary, amount);
  }
}