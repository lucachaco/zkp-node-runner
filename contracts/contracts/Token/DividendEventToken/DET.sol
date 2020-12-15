pragma solidity >=0.5.7;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Metadata.sol';
import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Enumerable.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

interface IFET {
    function burn(address account, uint256 amount) external;

    function approve(address account, uint256 amount) external;

    function balanceOf(address account) external view returns (uint256);
}

contract DET is ERC721Metadata('DividendEventToken', 'DET'), ERC721Enumerable, Ownable {
    using Address for address;
    using SafeMath for uint256;

    // address token ID list
    mapping(uint256 => uint256) internal tokenIndices;
    uint256[] internal tokenIds;
    mapping(uint256 => DividendInfo) internal tokenDetails;
    address _deployerAccount;

    constructor() public {
        _deployerAccount = msg.sender;
    }

    // FET contract address
    //IFET private _fungibleEventToken;

    struct DividendInfo {
        bytes32 dividendEventCode; //identifies the dividend event
        bytes32 opaqueInvestorID; //opaque identifier for the investor
        string hashOfCOR;
        bytes32 securitySymbol;
        uint256 amount; //number of shares
        uint256 dividendPerShare;
        uint256 withholdingTax; //withholding tax amount
        bytes32 country; //country of investor
        bytes32 treaty; //treaty category
        bytes32 recordDate;
        address responsibleEntityAddress; //Financial Entity that created DET
        string privateData; //encrypted investor data
        bytes32 dateOfPurchase;
        bytes32 dateOfSale;
        bytes1 liableToTax;
        bytes1 subjectToTax;
        bytes1 beneficialOwner;
        bytes1 permanentEstablishment;
        bytes1 securitiesPartOfBorrowing;
        bytes32 trackingID;
        uint256 levelCount;
        uint256 previousTokenId;
        bytes32 creationDate;
        bytes32 parentReceiveFTLogID;
    }

    event UpdateTax(uint256 indexed tokenId);

    /**
     * @dev Modifier for authorized action only for token holders
     * No call can be executed if executor is not address owner
     * @param to address representing the account of OCT owner
     */
    modifier onlyTokenOwner(address to) {
        require(to == msg.sender, 'Only token owner can manipulate the OCT!');
        _;
    }

    modifier isCalledByDeployer() {
        require(msg.sender == _deployerAccount, 'Only deployer address is allowed to do this!');
        _;
    }

    /**
     * @dev Function to set OCT contract address
     * No call can be executed if executor is not address owner
     * @param contractAddress address of the latet OCT contract
     * TODO who can access this function?
     */
    //function setFet(address contractAddress) external onlyOwner {
    // _fungibleEventToken = IFET(contractAddress);
    //}

    /**
     * @dev Function to set DET private encrypted data
     * @param tokenId token ID of DET
     * @param privateData private data of DET
     */
    function setPrivateData(uint256 tokenId, string calldata privateData) external {
        require(_exists(tokenId), 'TokenId does not exist!');
        DividendInfo memory temp = tokenDetails[tokenId];
        temp.privateData = privateData;
        tokenDetails[tokenId] = temp;
    }

    /**
     * @dev Function to get DET private encrypted data
     * @param tokenId token ID of DET
     * @return the encrypted data
     */
    function getPrivateData(uint256 tokenId) external view returns (string memory) {
        require(_exists(tokenId), 'TokenId does not exist!');
        DividendInfo memory temp = tokenDetails[tokenId];
        return temp.privateData;
    }

    /**
     * @dev Function to get DET public data
     * @param tokenId token ID of DET
     * @return the encrypted data
     */
    function getPublicData(uint256 tokenId)
        external
        view
        returns (
            address,
            uint256[5] memory,
            bytes32[11] memory,
            bytes1[5] memory,
            string memory
        )
    {
        require(_exists(tokenId), 'TokenId does not exist!');
        DividendInfo memory temp = tokenDetails[tokenId];
        uint256[5] memory tokenNumbers;
        tokenNumbers[0] = temp.dividendPerShare;
        tokenNumbers[1] = temp.withholdingTax;
        tokenNumbers[2] = temp.amount;
        tokenNumbers[3] = temp.levelCount;
        tokenNumbers[4] = temp.previousTokenId;
        bytes32[11] memory tokenByteValues;
        bytes1[5] memory tokenQuestionsValues;
        tokenByteValues[0] = temp.securitySymbol;
        tokenByteValues[1] = temp.country;
        tokenByteValues[2] = temp.treaty;
        tokenByteValues[3] = temp.recordDate;
        tokenByteValues[4] = temp.opaqueInvestorID;
        tokenByteValues[5] = temp.dividendEventCode;
        tokenByteValues[6] = temp.dateOfPurchase;
        tokenByteValues[7] = temp.dateOfSale;
        tokenByteValues[8] = temp.trackingID;
        tokenByteValues[9] = temp.creationDate;
        tokenByteValues[10] = temp.parentReceiveFTLogID;
        tokenQuestionsValues[0] = temp.liableToTax;
        tokenQuestionsValues[1] = temp.subjectToTax;
        tokenQuestionsValues[2] = temp.beneficialOwner;
        tokenQuestionsValues[3] = temp.permanentEstablishment;
        tokenQuestionsValues[4] = temp.securitiesPartOfBorrowing;

        return (
            temp.responsibleEntityAddress,
            tokenNumbers,
            tokenByteValues,
            tokenQuestionsValues,
            temp.hashOfCOR
        );
    }

    /**
     * @dev Function to get OCT balance
     * @param account address of the OCT owner
     * @return the amount of balance of the OCT owner
     */
    function getFetBalance(address account, address contractAddress) public view returns (uint256) {
        IFET _fungibleEventToken = IFET(contractAddress);
        return _fungibleEventToken.balanceOf(account);
    }

    function getAllTokens() public view returns (uint256[] memory) {
        return tokenIds;
    }

    /**
     * @dev Function to return all tokens that an owner has.
     * @param owner owner to be checked
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        return (_tokensOfOwner(owner));
    }

    /**
     * @dev Function to mint ERC721 DET for address to
     * By burning equvilant amount of OCT amount
     * @param to address of the DET minter
     * @param tokenId ID of the new DET token
     * @param tokenByteValues tokenByteValues of investor
     * @param contractAddress contractAddress of FET token
     */
    function mint(
        address to,
        uint256 tokenId,
        string calldata hashOfCOR,
        bytes32[11] calldata tokenByteValues,
        bytes1[5] calldata tokenQuestionsValues,
        uint256[4] calldata tokenNumbers,
        address contractAddress,
        address responsibleEntityAddress
    ) external onlyTokenOwner(to) {
        uint256 total = getFetBalance(to, contractAddress);
        require(tokenNumbers[1] <= total, 'Current address not enough balance!');
        require(!_exists(tokenId), "ERC721: token already minted");

        tokenIds.push(tokenId);

        // Make the number always larger than 0
        // Index is stored to be 1 bigger than actual index
        tokenIndices[tokenId] = tokenIds.length;
        DividendInfo memory dividendInfo;
        dividendInfo.opaqueInvestorID = tokenByteValues[0];
        dividendInfo.country = tokenByteValues[1];
        dividendInfo.treaty = tokenByteValues[2];
        dividendInfo.securitySymbol = tokenByteValues[3];
        dividendInfo.recordDate = tokenByteValues[4];
        dividendInfo.dividendEventCode = tokenByteValues[5];
        dividendInfo.dateOfPurchase = tokenByteValues[6];
        dividendInfo.dateOfSale = tokenByteValues[7];
        dividendInfo.trackingID = tokenByteValues[8];
        dividendInfo.creationDate = tokenByteValues[9];
        dividendInfo.parentReceiveFTLogID = tokenByteValues[10];
        dividendInfo.liableToTax = tokenQuestionsValues[0];
        dividendInfo.subjectToTax = tokenQuestionsValues[1];
        dividendInfo.beneficialOwner = tokenQuestionsValues[2];
        dividendInfo.permanentEstablishment = tokenQuestionsValues[3];
        dividendInfo.securitiesPartOfBorrowing = tokenQuestionsValues[4];
        dividendInfo.hashOfCOR = hashOfCOR;
        dividendInfo.dividendPerShare = tokenNumbers[0];
        dividendInfo.amount = tokenNumbers[1];
        dividendInfo.withholdingTax = tokenNumbers[2];
        dividendInfo.levelCount = tokenNumbers[3];
        dividendInfo.previousTokenId = 0;
        dividendInfo.responsibleEntityAddress = responsibleEntityAddress;
        tokenDetails[tokenId] = dividendInfo;
        // Create the fungible token with the contract address
        IFET _fungibleEventToken = IFET(contractAddress);
        _fungibleEventToken.burn(to, tokenNumbers[1]);
        super._mint(to, tokenId);
    }

    /**
     * @dev Function to mint ERC721 DET without previous OCT balance
     * @param to address of the DET minter
     * @param tokenId ID of the new DET token
     * @param tokenByteValues tokenByteValues of investor
     */
    function mintBlueToken(
        address to,
        uint256 tokenId,
        string calldata hashOfCOR,
        bytes32[9] calldata tokenByteValues,
        bytes1[5] calldata tokenQuestionsValues,
        uint256[4] calldata tokenNumbers,
        address responsibleEntityAddress
    ) external isCalledByDeployer() {
        require(!_exists(tokenId), "ERC721: token already minted");
        tokenIds.push(tokenId);

        // Make the number always larger than 0
        // Index is stored to be 1 bigger than actual index
        tokenIndices[tokenId] = tokenIds.length;
        DividendInfo memory dividendInfo;
        dividendInfo.opaqueInvestorID = tokenByteValues[0];
        dividendInfo.country = tokenByteValues[1];
        dividendInfo.treaty = tokenByteValues[2];
        dividendInfo.securitySymbol = tokenByteValues[3];
        dividendInfo.recordDate = tokenByteValues[4];
        dividendInfo.dividendEventCode = tokenByteValues[5];
        dividendInfo.dateOfPurchase = tokenByteValues[6];
        dividendInfo.dateOfSale = tokenByteValues[7];
        dividendInfo.creationDate = tokenByteValues[8];
        dividendInfo.liableToTax = tokenQuestionsValues[0];
        dividendInfo.subjectToTax = tokenQuestionsValues[1];
        dividendInfo.beneficialOwner = tokenQuestionsValues[2];
        dividendInfo.permanentEstablishment = tokenQuestionsValues[3];
        dividendInfo.securitiesPartOfBorrowing = tokenQuestionsValues[4];
        dividendInfo.hashOfCOR = hashOfCOR;
        dividendInfo.dividendPerShare = tokenNumbers[0];
        dividendInfo.amount = tokenNumbers[1];
        dividendInfo.withholdingTax = tokenNumbers[2];
        dividendInfo.previousTokenId = tokenNumbers[3];
        dividendInfo.levelCount = 0;
        dividendInfo.responsibleEntityAddress = responsibleEntityAddress;
        tokenDetails[tokenId] = dividendInfo;
        super._mint(to, tokenId);
    }

    /**
     * @dev Function to get Divident Info from token
     * @param tokenId tokenId of the NFT
     * @return the dividend amount in the token
     */
    function getDividendAmountFromToken(uint256 tokenId) public view returns (uint256) {
        uint256 amount = tokenDetails[tokenId].amount;
        return amount;
    }

    /**
     * @dev Function to burn one ERC721 DET for address owner
     * @param tokenId token ID of DET to burn
     */
    function burn(uint256 tokenId) external {
        address owner = super.ownerOf(tokenId);
        require(msg.sender == owner, 'Only token owner could burn the token!');
        require(tokenIds.length > 0, 'No remaining token to burn!');

        delete tokenDetails[tokenId];
        uint256 lastTokenId = tokenIds[tokenIds.length.sub(1)];
        uint256 removeTokenIndex = tokenIndices[tokenId].sub(1);
        tokenIds[removeTokenIndex] = lastTokenId;
        tokenIndices[lastTokenId] = removeTokenIndex.add(1);
        tokenIndices[tokenId] = 0;
        tokenIds.length--;
        super._burn(owner, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(super.ownerOf(tokenId) == msg.sender, "ERC721: cannot transfer unowned token");
        super.transferFrom(from, to, tokenId);
    }



    /**
     * @dev Function to update withholdingtax of given token
     * @param tokenId token ID of DET to update
     * @param _withholdingTax new tax to update
     */
    function setWithholdingTax(uint256 tokenId, uint256 _withholdingTax) external {
        tokenDetails[tokenId].withholdingTax = _withholdingTax;
        emit UpdateTax(tokenId);
    }

    /**
     * @dev Function to get DET withholding tax
     * @param tokenId token ID of DET
     * @return the withholding tax amount
     */
    function getWithholdingTax(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), 'TokenId does not exist!');
        DividendInfo memory temp = tokenDetails[tokenId];
        return temp.withholdingTax;
    }
}
