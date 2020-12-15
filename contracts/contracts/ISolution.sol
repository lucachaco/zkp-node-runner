pragma solidity ^0.5.8;

/**
 * ISolution defines the standard EY Blockchain solution interface.
 */
interface ISolution {
    function getOrganization() external view returns (address organizationAddress);

    function getPermissionNames() external view returns (bytes32[] memory permissionNames);

    function getNamespace() external view returns (bytes32 namespace);

    function getVersion() external view returns (bytes32 version);
}