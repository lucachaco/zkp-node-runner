pragma solidity ^0.5.7;

/**
 * @title Financial Entity mapping - Contract to store the different entities geenrated in system
 *
 * @dev Implementation of the Financial Entity Mapping.
 */
contract FinancialEntityMapping {
    
    struct ChildNode {
        address nodeAddress;
        uint numerator;
        uint denominator;
    }
    
    mapping(bytes32=> mapping(bytes32 => mapping(address => ChildNode[]))) childEntityMappings;
    mapping(bytes32=> mapping(bytes32 => mapping(address => address))) parentNodes;
    mapping(bytes32=> mapping(bytes32 => mapping(address => uint))) childNodeCount;
    
    event entityMappingsAdded(bytes32 securityId, bytes32 date, address nodeAddress, address parentNodeAddress, address[] childNodeAddresses, uint[] numerators, uint denominator);
    
    /**
    * @dev Add Entity mappings for a child node in blockchain 
    * @param securityId security Id from database
    * @param date date on which the mapping is set
    * @param nodeAddress is an address of the entity who is going to allocate securities to its sub entities
    * @param parentNodeAddress is an address of the entity which is the parent of the sub entity that is going to allocate the security mappings
    * @param childNodeAddresses is an address of the entity for which the ratio to be allocated
    * @param numerators numerator value for ratio to be allocated for the entity
    * @param denominator total value for the security
    */
    function addChildEntityMappings(bytes32 securityId, bytes32 date, address nodeAddress, address parentNodeAddress, address[] calldata childNodeAddresses, uint[] calldata numerators, uint denominator) external{
        require(childNodeAddresses.length>0, "At least one child node");
        require(childNodeAddresses.length == numerators.length, "Number of child nodes and numerators should be equal");
        uint numeratorCount = 0;
        for(uint i=0;i<numerators.length;i++) {
         numeratorCount+= numerators[i];
        }
        require(numeratorCount == denominator, "Ratios does not add up to denominator");
        for(uint i=0;i<numerators.length;i++) {
            ChildNode memory childNode = ChildNode(childNodeAddresses[i], numerators[i], denominator);
            childEntityMappings[securityId][date][nodeAddress].push(childNode);
            parentNodes[securityId][date][nodeAddress] = parentNodeAddress;
            childNodeCount[securityId][date][nodeAddress]+=1;
        }
        emit entityMappingsAdded(securityId, date, nodeAddress, parentNodeAddress, childNodeAddresses, numerators, denominator);
    }
    
    /**
    * @dev Retrieve no of child entities for a entity in blockchain 
    * @param securityId security Id from database
    * @param date on which mapping is set
    * @param nodeAddress is an address of the entity whose child count is to be found
    */
    function childCount(bytes32 securityId, bytes32 date, address nodeAddress) external view returns(uint) {
        uint nodeCount = childNodeCount[securityId][date][nodeAddress];
        return nodeCount;
    }
    
    /**
    * @dev Retrieve parent address of a node in blockchain 
    * @param securityId security Id from database
    * @param date date on which mapping is set
    * @param nodeAddress is an address of the entity whose parent is to be found
    */
    function parentNodeAddress(bytes32 securityId, bytes32 date, address nodeAddress) external view returns(address) {
        return parentNodes[securityId][date][nodeAddress];
    }
    
    /**
    * @dev Retrieve parent address of a node in blockchain 
    * @param securityId security Id from database
    * @param date date on which mapping is set
    * @param nodeAddress is an address of the entity whose child's share is to be found
    * @param index is the index at which the child node ratio is saved
    */
    function childNodeDetails(bytes32 securityId, bytes32 date, address nodeAddress, uint index) external view returns (address, uint, uint) {
        return (childEntityMappings[securityId][date][nodeAddress][index].nodeAddress, childEntityMappings[securityId][date][nodeAddress][index].numerator, childEntityMappings[securityId][date][nodeAddress][index].denominator);
    }
}