pragma solidity ^0.5.8;
import './Organization.sol';

contract TestContract {
  Organization internal organization;

  constructor(address _organizationAddress) public {
    organization = Organization(_organizationAddress);
  }

  /**
   * @dev Returns the sum of num1 and num2
   */
   function healthCheck() public view returns (address) {
    require(
            organization.externalPermissionCheck('superAdminView', "Taxwave", tx.origin),
            "User doesn't have the correct permissions."
        );
    return tx.origin;
    }
}
