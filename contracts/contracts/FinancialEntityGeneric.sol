pragma solidity ^0.5.7;

/**
 * @title Financial Entity - Contract to store the financial entities generated in system
 *
 * @dev Implementation of the Financial Entity.
 */
contract FinancialEntityGeneric {

    struct FinancialDetails {
       bytes32 entityType;
       string entityData;
   }

    mapping(address => FinancialDetails) financialEntites;
    event financialEntityRegistered(address financialEntity, bytes32 entityType, string entityData);

    /**
    * @dev Register a FinancialEntity in blockchain 
    * @param financialEntity Financial Entity address from Blockchain
    * @param entityType is the entity type of the financial entity.
    * @param entityData is an json value for entire entity data.
    */
    function register(address financialEntity, bytes32 entityType, string calldata entityData) external {
        financialEntites[financialEntity].entityData = entityData; 
        financialEntites[financialEntity].entityType = entityType; 
        emit financialEntityRegistered(financialEntity, entityType, entityData);
    }

    /**
    * @dev Retrieve the Financial Entity from blockchain 
    * @param entity financial entity address in blockchain
    * @return entityType entity type of financial entity
    * @return entityData json value of the entire entity data
    */
    function getFinancialEntity(address entity) external view returns (bytes32, string memory) {
        return (financialEntites[entity].entityType, financialEntites[entity].entityData);
    }
}

