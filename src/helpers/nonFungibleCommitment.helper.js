import { erc721 } from '../nightlite';
import { erc721 as erc721Mock } from '../services/nightlite.mock';
import config from '../config';
import nfTokenShieldJson from '../../build/contracts/NFTokenShield.json';
import { getSettingByKey } from '../services/settings.service';
import { nightliteSignTransaction } from '../services/authentication';
//const nightliteSignTransaction = undefined;

const mint = async (tokenId, zkpPublicKey, nfTokenShieldAddress, erc721Address, account, salt) => {
  let authorization;
  if (config.NIGHTLITE_SIGNING) {
    authorization = {};
    authorization.token = await getSettingByKey('APPLICATION_USER_TOKEN');
    authorization.url = config.AUTHENTICATION_URL;
    authorization.secretName = config.ZKP_DEPLOYED_PRIVATE_KEY_SECRET;
    authorization.newAccount = false;
  }
  const blockchainOptions = {
    erc721Address,
    nfTokenShieldJson,
    nfTokenShieldAddress,
    account,
  };
  const zokratesPath = `${config.ZOKRATES_FILES_PATH}/nft-mint`;
  const zokratesOptions = {
    codePath: `${zokratesPath}/out`,
    outputDirectory: zokratesPath,
    pkPath: `${zokratesPath}/proving.key`,
  };
  const useNightlite = await getSettingByKey('USE_NIGHTLITE');
  if (!useNightlite) {
    return erc721Mock.mint(tokenId, zkpPublicKey, salt, blockchainOptions, zokratesOptions);
  }
  return erc721.mint(
    tokenId,
    zkpPublicKey,
    salt,
    blockchainOptions,
    zokratesOptions,
    nightliteSignTransaction,
  );
};

const transfer = async (
  tokenId,
  receiverZkpPublicKey,
  originalCommitmentSalt,
  newCommitmentSalt,
  senderZkpPrivateKey,
  commitment,
  commitmentIndex,
  nfTokenShieldAddress,
  erc721Address,
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
  const blockchainOptions = {
    erc721Address,
    nfTokenShieldJson,
    nfTokenShieldAddress,
    account,
  };
  const zokratesPath = `${config.ZOKRATES_FILES_PATH}/nft-transfer`;
  const zokratesOptions = {
    codePath: `${zokratesPath}/out`,
    outputDirectory: zokratesPath,
    pkPath: `${zokratesPath}/proving.key`,
  };
  let response;
  const useNightlite = await getSettingByKey('USE_NIGHTLITE');
  if (!useNightlite) {
    response = await erc721Mock.transfer(
      tokenId,
      receiverZkpPublicKey,
      originalCommitmentSalt,
      newCommitmentSalt,
      senderZkpPrivateKey,
      commitment,
      commitmentIndex,
      blockchainOptions,
      zokratesOptions,
    );
  } else {
    response = await erc721.transfer(
      tokenId,
      receiverZkpPublicKey,
      originalCommitmentSalt,
      newCommitmentSalt,
      senderZkpPrivateKey,
      commitment,
      commitmentIndex,
      blockchainOptions,
      zokratesOptions,
      nightliteSignTransaction,
    );
  }
  const outputCommitmentIndex = parseInt(response.outputCommitmentIndex, 10);
  return { ...response, outputCommitmentIndex };
};

const burn = async (
  tokenId,
  receiverZkpPrivateKey,
  salt,
  commitment,
  commitmentIndex,
  nfTokenShieldAddress,
  erc721Address,
  tokenReceiver,
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
    erc721Address,
    nfTokenShieldJson,
    nfTokenShieldAddress,
    tokenReceiver,
    account,
  };
  const zokratesPath = `${config.ZOKRATES_FILES_PATH}/nft-burn`;
  const zokratesOptions = {
    codePath: `${zokratesPath}/out`,
    outputDirectory: zokratesPath,
    pkPath: `${zokratesPath}/proving.key`,
  };
  const useNightlite = await getSettingByKey('USE_NIGHTLITE');
  if (!useNightlite) {
    return erc721Mock.burn(
      tokenId,
      receiverZkpPrivateKey,
      salt,
      commitment,
      commitmentIndex,
      blockchainOptions,
      zokratesOptions,
    );
  }
  return erc721.burn(
    tokenId,
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
