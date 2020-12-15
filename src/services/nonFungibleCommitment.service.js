import { randomHex, shaHash } from 'zkp-utils';

import { mint, transfer, burn } from '../helpers/nonFungibleCommitment.helper';
import { create, update, findOne, listAll } from '../storage/nonFungibleCommitment.storage';
import { mint as mintNFTMetadata } from '../contractHelpers/nonFungibleTokenMetadata.helper';
import validateString from '../middleware/validation';
// eslint-disable-next-line import/no-cycle
import { prepareAndSendMessage } from './whisper.service';
import { retryProcess } from '../contractHelpers/retryUtil';
import { logger } from '../logger';
import config from '../config';

const persistCommitment = async ({
  tokenId,
  commitment,
  commitmentIndex,
  salt,
  isTransferred = false,
  isRecieved = false,
}) => {
  return create({
    tokenId,
    commitment,
    commitmentIndex,
    salt,
    isTransferred,
    isRecieved,
    isMinted: true,
  });
};

const getCommitment = async tokenId => {
  return findOne(tokenId);
};

/**
 * Calls Nightlite's ERC721 mint function to mint a Non Fungible Token commitment.
 * @param {String} tokenId - unique string representing the NFToken. Must be a 32 byte hex string with a leading 'x0'.
 * @param {String} zkpPublicKey - the public key that will own the NFT commitment inside the NFShieldContract. Must be a 32 byte hex string with a leading 'x0'.
 * @param {String} nfTokenShieldAddress - Address of deployed nfTokenShieldContract. Must be a 20 byte hex string with a leading 'x0'.
 * @param {String} account - Account that is sending these transactions. Must be a 20 byte hex string with a leading 'x0'.
 * @param {String} [salt] - A random hex string used in the mint process. Must be a 32 byte hex string with a leading 'x0'.
 * @returns {Object} response
 * @returns {String} response.commitment - Commitment of the minted coins
 * @returns {Number} response.commitmentIndex - the index of the token within the Merkle Tree.  This is required for later transfers/joins so that Alice knows which 'chunks' of the Merkle Tree she needs to 'get' from the NFTokenShield contract in order to calculate a path.
 * @returns {string} response.salt - random 32 byte hexstring used in the minting process and needed to transfer the NFT
 */
const mintNonFungibleCommitment = async (
  _tokenId,
  uri,
  zkpPrivateKey,
  nfTokenShieldAddress,
  erc721Address,
  account,
) => {
  try {
    validateString(
      zkpPrivateKey,
      66,
      'zkpPrivateKey must be a length 66 hex string with leading 0x',
    );
    const zkpPublicKey = shaHash(zkpPrivateKey); // get publickey from private key
    validateString(account, 42, 'account must be a length 42 hex string with leading 0x');
    const salt = await randomHex(32); // generate random salt.
    const tokenId = _tokenId || (await randomHex(32));
    const receipt = await retryProcess(async () => {
      return mintNFTMetadata(erc721Address, config.PREFUNDED_ETH_ADDR_PRIVATE_KEY, tokenId, uri);
    }, 'Mint Public ERC721');
    logger.debug(`Mint Public ERC721 receipt: ${JSON.stringify(receipt)}`);
    const commitment = await retryProcess(
      async () => mint(tokenId, zkpPublicKey, nfTokenShieldAddress, erc721Address, account, salt),
      'Mint Private ERC721',
    );
    logger.debug(`Mint Private ERC721 receipt: ${JSON.stringify(commitment)}`);
    return persistCommitment({
      salt,
      tokenId,
      commitment: commitment.commitment,
      commitmentIndex: parseInt(commitment.commitmentIndex, 10),
    });
  } catch (error) {
    logger.error('Error while minting non fungible commitment: '.concat(error));
    throw error;
  }
};

/**
 * Calls Nightlite's ERC721 tranfer function to privately transfer a Non Fungible Token token between two accounts.
 * @param {String} tokenId - unique string representing the NFToken. Must be a 32 byte hex string with a leading 'x0'.
 * @param {String} receiverZkpPublicKey - the public key that will recieve the NFT commitment. Must be a 32 byte hex string with a leading 'x0'.
 * @param {String} senderZkpPrivateKey - the private key that owns the NFT commitment. Must be a 32 byte hex string with a leading 'x0'.
 * @param {String} nfTokenShieldAddress - Address of deployed nfTokenShieldContract. Must be a 20 byte hex string with a leading 'x0'.
 * @param {String} account - Account that is sending these transactions. Must be a 20 byte hex string with a leading 'x0'.
 * @param {String} receiverWhisperAddress - whisper address to send a TRANSFER message
 * @returns {String} outputCommitment - New commitment
 * @returns {Number} outputCommitmentIndex - the index of the token within the Merkle Tree.  This is required for later transfers/joins so that Alice knows which 'chunks' of the Merkle Tree she needs to 'get' from the NFTokenShield contract in order to calculate a path.
 * @returns {Object} txReceipt - a promise of a blockchain transaction
 */
const transferNonFungibleCommitment = async (
  tokenId,
  receiverZkpPublicKey,
  senderZkpPrivateKey,
  nfTokenShieldAddress,
  erc721Address,
  account,
  receiverWhisperAddress,
) => {
  validateString(tokenId, 66, 'tokenId must be a length 66 hex string with leading 0x');
  validateString(
    receiverZkpPublicKey,
    66,
    'receiverZkpPublicKey must be a length 66 hex string with leading 0x',
  );
  validateString(
    senderZkpPrivateKey,
    66,
    'senderZkpPrivateKey must be a length 66 hex string with leading 0x',
  );
  validateString(
    nfTokenShieldAddress,
    42,
    'nfTokenShieldAddress must be a length 42 hex string with leading 0x',
  );
  validateString(account, 42, 'account must be a length 42 hex string with leading 0x');
  const newCommitmentSalt = await randomHex(32); // use _salt param or generate random salt.
  const oldCommitment = await getCommitment(tokenId);
  if (!oldCommitment) {
    throw Error('No Commitment found with that tokenId');
  }
  const response = await retryProcess(
    async () =>
      transfer(
        tokenId,
        receiverZkpPublicKey,
        oldCommitment.salt,
        newCommitmentSalt,
        senderZkpPrivateKey,
        oldCommitment.commitment,
        oldCommitment.commitmentIndex,
        nfTokenShieldAddress,
        erc721Address,
        account,
      ),
    'Transfer Private ERC721',
  );
  const { outputCommitment, outputCommitmentIndex } = response;
  await update(oldCommitment.commitment, { isTransferred: true, isNullified: true });
  const newCommitment = {
    tokenId,
    commitment: outputCommitment,
    commitmentIndex: outputCommitmentIndex,
    salt: newCommitmentSalt,
  };
  if (receiverWhisperAddress) {
    prepareAndSendMessage('TRANSFER', JSON.stringify(newCommitment), receiverWhisperAddress);
  } else {
    logger.info(
      `no receiverWhisperAddress to send ft outputCommitment\n${JSON.stringify(newCommitment)}`,
    );
  }
  return { ...response, newCommitmentSalt };
};

/**
 * Calls Nightlite's ERC721 burn function to burn a Non Fungible Token commitment.
 * @param {String} tokenId - unique string representing the NFToken. Must be a 32 byte hex string with a leading 'x0'.
 * @param {String} ownerZkpPrivateKey - privatekey of the wallet inside the shiedl contract that owns the token
 * @param {String} [salt] - A random hex string used in the burn process. Must be a 32 byte hex string with a leading 'x0'.
 * @param {String} commitment - Commitment that contains the token. Must be a 32 byte hex string with a leading 'x0'.
 * @param {Number} commitmentIndex - Index of the commitment within the Merkle Tree.
 * @param {String} nfTokenShieldAddress - Address of deployed nfTokenShieldContract. Must be a 20 byte hex string with a leading 'x0'.
 * @param {String} account - Account that is sending these transactions. Must be a 20 byte hex string with a leading 'x0'.
 * @param {String} tokenReceiver - Public key os the account in the main Ethereum net that will recieve the normal NFT once the zkpNFT is burnt
 * @returns {Object} txReceipt - a promise of a blockchain transaction
 */
const burnNonFungibleCommitment = async (
  tokenId,
  ownerZkpPrivateKey,
  _tokenReceiver,
  nfTokenShieldAddress,
  erc721Address,
  account,
) => {
  validateString(tokenId, 66, 'tokenId must be a length 66 hex string with leading 0x');
  validateString(
    ownerZkpPrivateKey,
    66,
    'ownerZkpPrivateKey must be a length 66 hex string with leading 0x',
  );
  validateString(
    nfTokenShieldAddress,
    42,
    'nfTokenShieldAddress must be a length 42 hex string with leading 0x',
  );
  validateString(account, 42, 'account must be a length 42 hex string with leading 0x');
  const tokenReceiver = _tokenReceiver || account;
  validateString(tokenReceiver, 42, 'tokenReceiver must be a length 42 hex string with leading 0x');
  const nftCommitment = await getCommitment(tokenId);
  if (!nftCommitment) {
    throw Error('No Commitment found with that tokenId');
  }
  const txReceit = await retryProcess(
    async () =>
      burn(
        tokenId,
        ownerZkpPrivateKey,
        nftCommitment.salt,
        nftCommitment.commitment,
        nftCommitment.commitmentIndex,
        nfTokenShieldAddress,
        erc721Address,
        tokenReceiver,
        account,
      ),
    'Burn Private ER721',
  );
  await update(nftCommitment.commitment, { isNullified: true, isBurned: true });
  return txReceit;
};

export {
  mintNonFungibleCommitment,
  transferNonFungibleCommitment,
  burnNonFungibleCommitment,
  listAll,
};
