const express = require('express');
const ethers = require('./ethers');
/*
const {
  deployNonFungibleToken,
  mintNonFungibleToken,
  getErroMessage,
} = require('./services/nonFungibleToken.service');

const { deployFungibleToken } = require('./services/fungibleToken.service');
*/

const api = express();
const port = 3001;
ethers.connect();

api.get('/health-check', async (req, res) => {
  /*const account = '0x0c1c28336f5f256bd6657215f00ee83121e51336';
  const privateKey = '0x6406dee0024f4153023622b2cb85bb6a1a215e245e071dbfd801070814339644';
  // const privateKey = '0xf0fada4070ce6946aac687b913f0508094f0b2e4327fe69f2ad5cec949995879';
  const deployFungibleTokenResponse = await deployFungibleToken({
    privateKey,
    name: 'name',
    symbol: 'symbol',
    initialAccountAddress: account,
    initialBalance: 9000000000,
  });

  console.log({ deployFungibleTokenResponse });
  const fungibleTokenContractAddress = deployFungibleTokenResponse.contractAddress;

  // const tokenId = 2;
  // eslint-disable-next-line no-underscore-dangle
  const _uri = '00';

  const deployNonFungibleTokenResponse = await deployNonFungibleToken({ privateKey });

  console.log({ deployNonFungibleTokenResponse });

  try {
    const mintNonFungibleTokenReceipt = await mintNonFungibleToken({
      privateKey,
      contractAddress: deployNonFungibleTokenResponse.contractAddress,
      account,
      tokenId: 1,
      _uri,
      fungibleTokenContractAddress,
    });
    console.log('Mint 1: ', mintNonFungibleTokenReceipt);
    const mintNonFungibleTokenReceipt2 = await mintNonFungibleToken({
      privateKey,
      contractAddress: deployNonFungibleTokenResponse.contractAddress,
      account,
      tokenId: 1,
      _uri,
      fungibleTokenContractAddress,
    });
    console.log('Mint 2: ', mintNonFungibleTokenReceipt2);
  } catch (err) {
    console.log(err);
    console.log(err.transaction.hash);

    await getErroMessage(err.transaction.hash);
  }*/

  return res.send('Finished!');
});

api.listen(port, () => console.log(`Example app listening on port ${port}!`));
