pragma solidity ^0.5.7;

contract SecurityIssuerRegistry {

    struct SecurityIssuerDetails {
        bytes32 businessIdentifierCode;
        bytes32 name;
        bytes32 countryOfResidence;
    }

    mapping(bytes32 => SecurityIssuerDetails) securityIssuers;
    bytes32[] public businessIdentifierCodes;
    event securityIssuerEdited(bytes32 businessIdentifierCode, bytes32 name, bytes32 countryOfResidence);

    function createSecurityIssuer(bytes32 _businessIdentifierCode, bytes32 _name, bytes32 _countryOfResidence) external {
        securityIssuers[_businessIdentifierCode].businessIdentifierCode = _businessIdentifierCode;
        securityIssuers[_businessIdentifierCode].name = _name;
        securityIssuers[_businessIdentifierCode].countryOfResidence = _countryOfResidence;

        businessIdentifierCodes.push(_businessIdentifierCode) -1;
    }

    function getSecurityIssuerCodes() external view returns (bytes32[] memory) {
        return businessIdentifierCodes;
    }

    function getSecurityIssuer(bytes32 _businessIdentifierCode) external view returns (bytes32, bytes32, bytes32){
        return (
            securityIssuers[_businessIdentifierCode].businessIdentifierCode,
            securityIssuers[_businessIdentifierCode].name,
            securityIssuers[_businessIdentifierCode].countryOfResidence
        );
    }

    function editSecurityIssuer(bytes32 _businessIdentifierCode, bytes32 _name, bytes32 _countryOfResidence) external {
        securityIssuers[_businessIdentifierCode].businessIdentifierCode = _businessIdentifierCode;
        securityIssuers[_businessIdentifierCode].name = _name;
        securityIssuers[_businessIdentifierCode].countryOfResidence = _countryOfResidence;

        emit securityIssuerEdited(_businessIdentifierCode, _name, _countryOfResidence);
    }

    function deleteSecurityIssuer(bytes32 _businessIdentifierCode, uint _atIndex) external {
        if (_atIndex >= businessIdentifierCodes.length) return;
        for (uint i = _atIndex; i<businessIdentifierCodes.length-1; i++){
            businessIdentifierCodes[i] = businessIdentifierCodes[i+1];
        }
        delete businessIdentifierCodes[businessIdentifierCodes.length-1];
        businessIdentifierCodes.length--;
        delete securityIssuers[_businessIdentifierCode];
    }
}



