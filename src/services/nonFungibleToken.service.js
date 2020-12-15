const {
  deploy,
  deploy2,
  deploy3,
  mint,
  mint2,
  mint3,
  getError,
} = require('../helpers/nonFungibleToken.helper');

const deployNonFungibleToken = async ({ privateKey }) => {
  try {
    return await deploy2(privateKey);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const getErroMessage = async hash => {
  try {
    return await getError(hash);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
const mintNonFungibleToken = async ({
  privateKey,
  account,
  contractAddress,
  tokenId,
  _uri,
  fungibleTokenContractAddress,
}) => {
  const mintResult = await mint2({
    privateKey,
    account,
    contractAddress,
    tokenId,
    _uri,
    fungibleTokenContractAddress,
  });
  return mintResult;
};

module.exports = { deployNonFungibleToken, mintNonFungibleToken, getErroMessage };
