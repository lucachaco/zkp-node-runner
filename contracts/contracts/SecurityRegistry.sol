pragma solidity ^0.5.7;

contract SecurityRegistry {
    struct SecurityDetails {
        bytes32 symbol;
        bytes32 ISIN;
        bytes32 name;
        bytes32 description;
        bytes32 countryCode;
        bytes32 securityType;
        bytes32 localCustodianBusinessIdentifierCode;
        bytes32 securityIssuerBusinessIdentifierCode;
        bytes32 sourceCountryCurrency;
    }
    mapping(bytes32 => SecurityDetails) securities;
    bytes32[] public securitySymbols;
    event securityEdited(bytes32 symbol, 
        bytes32 ISIN, 
        bytes32 name,
        bytes32 description,
        bytes32 countryCode,
        bytes32 securityType,
        bytes32 localCustodianBusinessIdentifierCode,
        bytes32 securityIssuerBusinessIdentifierCode,
        bytes32 sourceCountryCurrency);

    function createSecurity(
        bytes32 _symbol,
        bytes32 _ISIN,
        bytes32 _name,
        bytes32 _description,
        bytes32 _countryCode,
        bytes32 _securityType,
        bytes32 _localCustodianBusinessIdentifierCode,
        bytes32 _securityIssuerBusinessIdentifierCode,
        bytes32 _sourceCountryCurrency
    )
    external {

        securities[_symbol].symbol = _symbol;
        securities[_symbol].ISIN = _ISIN;
        securities[_symbol].name = _name;
        securities[_symbol].description = _description;
        securities[_symbol].countryCode = _countryCode;
        securities[_symbol].securityType = _securityType;
        securities[_symbol].localCustodianBusinessIdentifierCode = _localCustodianBusinessIdentifierCode;
        securities[_symbol].securityIssuerBusinessIdentifierCode = _securityIssuerBusinessIdentifierCode;
        securities[_symbol].sourceCountryCurrency = _sourceCountryCurrency;

        securitySymbols.push(_symbol) -1;
    }

    function getSecuritySymbols() external view returns (bytes32[] memory) {
        return securitySymbols;
    }

    function getSecurity(bytes32 _symbol) external view returns
        (bytes32, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32, bytes32) {

        SecurityDetails memory security = securities[_symbol];

        return (
            security.symbol,
            security.ISIN,
            security.name,
            security.description,
            security.countryCode,
            security.securityType,
            security.localCustodianBusinessIdentifierCode,
            security.securityIssuerBusinessIdentifierCode,
            security.sourceCountryCurrency
        );
    }

    function editSecurity(
        bytes32 _symbol,
        bytes32 _ISIN,
        bytes32 _name,
        bytes32 _description,
        bytes32 _countryCode,
        bytes32 _securityType,
        bytes32 _localCustodianBusinessIdentifierCode,
        bytes32 _securityIssuerBusinessIdentifierCode,
        bytes32 _sourceCountryCurrency
    )
    external {

        securities[_symbol].symbol = _symbol;
        securities[_symbol].ISIN = _ISIN;
        securities[_symbol].name = _name;
        securities[_symbol].description = _description;
        securities[_symbol].countryCode = _countryCode;
        securities[_symbol].securityType = _securityType;
        securities[_symbol].localCustodianBusinessIdentifierCode = _localCustodianBusinessIdentifierCode;
        securities[_symbol].securityIssuerBusinessIdentifierCode = _securityIssuerBusinessIdentifierCode;
        securities[_symbol].sourceCountryCurrency = _sourceCountryCurrency;

        emit securityEdited(_symbol, 
                        _ISIN, 
                        _name, 
                        _description, 
                        _countryCode, 
                        _securityType, 
                        _localCustodianBusinessIdentifierCode, 
                        _securityIssuerBusinessIdentifierCode, 
                        _sourceCountryCurrency);
    }

    function deleteSecurity(bytes32 _symbol, uint _atIndex) external {
        if (_atIndex >= securitySymbols.length) return;
        for (uint i = _atIndex; i<securitySymbols.length-1; i++){
            securitySymbols[i] = securitySymbols[i+1];
        }
        delete securitySymbols[securitySymbols.length-1];
        securitySymbols.length--;
        delete securities[_symbol];
    }
}
