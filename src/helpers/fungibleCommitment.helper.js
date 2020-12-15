import { randomHex, shaHash } from 'zkp-utils';
import { erc20 } from '../nightlite';
import { erc20 as erc20Mock } from '../services/nightlite.mock';
import fTokenShieldJson from '../../build/contracts/FTokenShield.json';
import { getSettingByKey } from '../services/settings.service';
import config from '../config';
import { logger } from '../logger';
 import { nightliteSignTransaction } from '../services/authentication';
//const nightliteSignTransaction = undefined;
/**
 * Formats an amount to a 0x lead hex string,
 * required to be a blockchain transaction input.
 * @param {number} amount
 */
const formatIntegerInput = amount => {
  return `0x${amount.toString(16).padStart(32, '0')}`;
};

/**
 * Mint a coin
 * @param {Number} amount - the value of the coin
 * @param {String} zkpPrivateKey - Alice's private key
 * @param {String} salt - Alice's token serial number as a hex string
 * @param fTokenShieldAddress
 * @param account
 * @returns {String} commitment - Commitment of the minted coins
 * @returns {Number} commitmentIndex
 */
const mint = async (amount, zkpPrivateKey, salt, fTokenShieldAddress, erc20Address, account) => {
  let authorization;
  if (config.NIGHTLITE_SIGNING) {
    authorization = {};
    authorization.token = await getSettingByKey('APPLICATION_USER_TOKEN');
    authorization.url = config.AUTHENTICATION_URL;
    authorization.secretName = config.ZKP_DEPLOYED_PRIVATE_KEY_SECRET;
    authorization.newAccount = false;
  }
  const zkpPublicKey = shaHash(zkpPrivateKey);
  const blockchainOptions = {
    erc20Address,
    fTokenShieldJson,
    fTokenShieldAddress,
    account,
  };
  const amountInput = formatIntegerInput(amount);
  const zokratesPath = `${config.ZOKRATES_FILES_PATH}/ft-mint`;
  const zokratesOptions = {
    codePath: `${zokratesPath}/out`,
    outputDirectory: zokratesPath,
    pkPath: `${zokratesPath}/proving.key`,
  };
  const useNightlite = await getSettingByKey('USE_NIGHTLITE');
  if (!useNightlite) {
    return erc20Mock.mint(amountInput, zkpPublicKey, salt, blockchainOptions, zokratesOptions);
  }
  return erc20.mint(
    amountInput,
    zkpPublicKey,
    salt,
    blockchainOptions,
    zokratesOptions,
    nightliteSignTransaction,
  );
};

const transfer = async (
  commitmentA,
  commitmentB,
  sendingAmount,
  receiverPublicKey,
  senderSecretKey,
  fTokenShieldAddress,
  erc20Address,
  account,
) => {
  let authorization;
  if (config.NIGHTLITE_SIGNING) {
    authorization = {};
    authorization.token = await getSettingByKey('APPLICATION_USER_TOKEN');
    authorization.url = config.AUTHENTICATION_URL;
    authorization.secretName = config.ZKP_DEPLOYED_PRIVATE_KEY_SECRET;
    authorization.newAccount = true;
  }
  logger.debug(`spending ${sendingAmount}`);
  logger.debug(`receiverPublicKey ${receiverPublicKey}`);
  logger.debug(`senderSecretKey ${senderSecretKey}`);
  const inputCommitments = [
    {
      value: formatIntegerInput(commitmentA.balance),
      salt: commitmentA.salt,
      commitment: commitmentA.id,
      commitmentIndex: commitmentA.index,
    },
    {
      value: formatIntegerInput(commitmentB.balance),
      salt: commitmentB.salt,
      commitment: commitmentB.id,
      commitmentIndex: commitmentB.index,
    },
  ];
  logger.debug(`inputCommitments ${JSON.stringify(inputCommitments)}`);
  const balanceA = commitmentA.balance * 1;
  const balanceB = commitmentB.balance * 1;
  const spending = sendingAmount * 1;
  const change = balanceA + balanceB - spending;
  if (change < 0) {
    throw new Error('Not enough balance in the two commitments to spend');
  }
  const outputCommitments = [
    {
      value: formatIntegerInput(sendingAmount),
      salt: await randomHex(32),
    },
    {
      value: formatIntegerInput(change),
      salt: await randomHex(32),
    },
  ];
  logger.debug(`inputCommitments ${JSON.stringify(outputCommitments)}`);
  const blockchainOptions = {
    erc20Address,
    fTokenShieldJson,
    fTokenShieldAddress,
    account,
  };
  const zokratesPath = `${config.ZOKRATES_FILES_PATH}/ft-transfer`;
  const zokratesOptions = {
    codePath: `${zokratesPath}/out`,
    outputDirectory: zokratesPath,
    pkPath: `${zokratesPath}/proving.key`,
  };
  const useNightlite = await getSettingByKey('USE_NIGHTLITE');
  if (!useNightlite) {
    return erc20Mock.transfer(
      inputCommitments,
      outputCommitments,
      receiverPublicKey,
      senderSecretKey,
      blockchainOptions,
      zokratesOptions,
    );
  }
  return erc20.transfer(
    inputCommitments,
    outputCommitments,
    receiverPublicKey,
    senderSecretKey,
    blockchainOptions,
    zokratesOptions,
    nightliteSignTransaction,
  );
};

const burn = async (
  amount,
  receiverZkpPrivateKey,
  salt,
  commitment,
  commitmentIndex,
  fTokenShieldAddress,
  erc20Address,
  account,
) => {
  let authorization;
  if (config.NIGHTLITE_SIGNING) {
    authorization = {};
    authorization.token = await getSettingByKey('APPLICATION_USER_TOKEN');
    authorization.url = config.AUTHENTICATION_URL;
    authorization.secretName = config.ZKP_DEPLOYED_PRIVATE_KEY_SECRET;
    authorization.newAccount = false;
  }
  const blockchainOptions = {
    erc20Address,
    fTokenShieldJson,
    fTokenShieldAddress,
    account,
    tokenReceiver: account,
  };
  const zokratesPath = `${config.ZOKRATES_FILES_PATH}/ft-burn`;
  const zokratesOptions = {
    codePath: `${zokratesPath}/out`,
    outputDirectory: zokratesPath,
    pkPath: `${zokratesPath}/proving.key`,
  };
  const amountInput = formatIntegerInput(amount);
  const useNightlite = await getSettingByKey('USE_NIGHTLITE');
  if (!useNightlite) {
    return erc20Mock.burn(
      amountInput,
      receiverZkpPrivateKey,
      salt,
      commitment,
      commitmentIndex,
      blockchainOptions,
      zokratesOptions,
    );
  }
  return erc20.burn(
    amountInput,
    receiverZkpPrivateKey,
    salt,
    commitment,
    commitmentIndex,
    blockchainOptions,
    zokratesOptions,
    nightliteSignTransaction,
  );
};

export { mint, transfer, burn };
