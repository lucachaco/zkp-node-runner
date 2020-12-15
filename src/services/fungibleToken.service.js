const { deploy, mint } = require('../helpers/fungibleToken.helper');

const deployFungibleToken = async params => {
  try {
    return await deploy(params);
  } catch (err) {
    console.log(err);
    throw err;
  }
};
const mintFungibleToken = async ({ privateKey, contractAddress, tokenId, _uri }) => {
  const mintResult = await mint({ privateKey, contractAddress, tokenId, _uri });
  return mintResult;
};

module.exports = { deployFungibleToken, mintFungibleToken };
