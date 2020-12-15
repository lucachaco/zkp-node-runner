pragma solidity ^0.5.8;

import './ISolution.sol';
import './Organization.sol';

contract TaxwaveSolution is ISolution {
    Organization internal organization;
    bytes32[] permissionNames = [
    // UI
    bytes32('superAdminView'),
    // API
    bytes32('canRequestDataMigration'),
    // Smart Contract
    bytes32('canTransferTokens')
    ];
    bytes32 namespace = "Taxwave";
    bytes32 version = "0.1";
    address[] diContracts;

    constructor(address _organization) public {
        organization = Organization(_organization);
    }

    function getOrganization() public view returns (address) {
        return address(organization);
    }

    function getPermissionNames() public view returns (bytes32[] memory) {
        return permissionNames;
    }

    function getNamespace() public view returns (bytes32) {
        return namespace;
    }

    function getVersion() public view returns (bytes32) {
        return version;
    }
}