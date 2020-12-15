pragma solidity ^0.5.7;

/**
 * @title Financial Entity - Contract to store the financial entities generated in system
 *
 * @dev Implementation of the Financial Entity.
 */
contract FinancialEntityRegistry {

    struct FinancialDetails {
       address entityAddress;
       bytes32 code;
       bytes32 name;
       bytes32 countryOfResidence;
       bytes32 businessIdentifierCode;
       bytes32 entityType;
       string zkpPublicKey;
       string whisperPublicAddress;
       bool hasValue;
   }
    address[] public addresses;


    mapping(address => FinancialDetails) financialEntities;
    event financialEntityRegistered(bytes32[5] entityDetails, string zkpPublicKey, string whisperPublicAddress);
    
    /**
    * @dev Register/Update a financialEntityAddress in blockchain
    * @param entityDetails is an bytes32 array that will have code, name, countryOfResidence, businessIdentifierCode, entityType, zkpPublicKey
    * @param whisperPublicAddress is a string containing the whisperPublicAddress of this entity.
    */
    function register(bytes32[5] calldata entityDetails, string calldata zkpPublicKey, string calldata whisperPublicAddress) external {
        bool exists = false;
        if(financialEntities[msg.sender].hasValue) {
            exists = true;
        }
        financialEntities[msg.sender].entityAddress = msg.sender;
        financialEntities[msg.sender].code = entityDetails[0];
        financialEntities[msg.sender].name = entityDetails[1];
        financialEntities[msg.sender].countryOfResidence = entityDetails[2];
        financialEntities[msg.sender].businessIdentifierCode = entityDetails[3];
        financialEntities[msg.sender].entityType = entityDetails[4];
        financialEntities[msg.sender].zkpPublicKey = zkpPublicKey;
        financialEntities[msg.sender].whisperPublicAddress = whisperPublicAddress;
        financialEntities[msg.sender].hasValue = true;
        if(!exists) {
            addresses.push(msg.sender);
        }
        emit financialEntityRegistered(entityDetails, zkpPublicKey, whisperPublicAddress);
    }

    /**
    * @dev Retrieve the Financial Entity from blockchain
    * @param entity financial entity address in blockchain
    * @return code, name, countryOfResidence, businessIdentifierCode and entity type
    */
    function getFinancialEntity(address entity) external view returns (bytes32, bytes32, bytes32, bytes32, bytes32, string memory, string memory) {
        return (financialEntities[entity].code, financialEntities[entity].name,financialEntities[entity].countryOfResidence,financialEntities[entity].businessIdentifierCode, financialEntities[entity].entityType, financialEntities[entity].zkpPublicKey, financialEntities[entity].whisperPublicAddress);
    }

    function getAddresses() external view returns (address[] memory) {
        return addresses;
    }

}

