import {
  getContractInstance,
  getContractInstanceWithSigner,
  sendSignedTransaction,
} from '../ethers';
import NFTokenMetadata from '../../build/contracts/NFTokenMetadata.json';
import { signTransaction } from '../services/authentication';
import { retryTransactionProcess } from './retryUtil';

// TODO test Authentication signing in NFTMetadata methods
const getInstance = async contractAddress => {
  return getContractInstance(NFTokenMetadata.abi, contractAddress);
};

const getInstanceWithSigner = async (contractAddress, privateKey) => {
  return getContractInstanceWithSigner(NFTokenMetadata.abi, contractAddress, privateKey);
};

const mint = async (contractAddress, privateKey, tokenId, uri = '') => {
  const contractInstance = await getInstanceWithSigner(
    contractAddress,
    privateKey,
    NFTokenMetadata,
  );
  return contractInstance.mint(tokenId, uri);
};

const burn = async (contractAddress, privateKey, tokenId, authorization) => {
  if (authorization) {
    const stepName = 'NonFungible Token Metadata Burn';
    const burnAction = async () => {
      const createTransaction = async () => {
        const contractInstance = await getInstance(contractAddress, NFTokenMetadata);
        const tx = await contractInstance.interface.functions.burn.encode([tokenId]);
        return signTransaction(tx, authorization, contractAddress);
      };
      return sendSignedTransaction(createTransaction, stepName);
    };
    return retryTransactionProcess(burnAction, stepName);
  }
  const contractInstance = await getInstanceWithSigner(
    contractAddress,
    privateKey,
    NFTokenMetadata,
  );
  return contractInstance.burn(tokenId);
};

export { mint, burn };
