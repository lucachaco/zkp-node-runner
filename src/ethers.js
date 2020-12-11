const ethers = require('ethers');
const retry = require('retry');
const config = require('./config');

let etherjsProvider;
/**
 * Connects to Blockchain and then sets proper handlers for events
 */
const connect = () => {
  console.log('Blockchain Connecting ...');
  console.log(`Connecting to: ${config.RPC_PROVIDER}`);

  try {
    // const connectionInfo = { url: config.RPC_PROVIDER, timeout: 3000000 };
    etherjsProvider = new ethers.providers.JsonRpcProvider(config.RPC_PROVIDER);
  } catch (e) {
    console.log('Error while connecting to the provider: ');
  }

  const handleError = err => {
    console.error('Blockchain Error ...', err);
    console.log('Reconnecting to RPC ...');
    connect();
    // throw err;
  };

  etherjsProvider.on('error', handleError);
  etherjsProvider.getBlockNumber().then(blockNumber => {
    console.log(`Blockchain connected to geth node. Current block number: ${blockNumber}`);
  });
  etherjsProvider.listAccounts().then(accounts => {
    console.log('Accounts list', accounts);
  });
};

/**
 * Returns the default provider.
 */
const getProvider = () => {
  const promise = new Promise(resolve => {
    if (etherjsProvider !== undefined) {
      etherjsProvider
        .getBlockNumber()
        .then(blockNumber => {
          console.log(`Blockchain connected to geth node. Current block number: ${blockNumber}`);
          resolve(etherjsProvider);
        })
        .catch(error => {
          console.log('Error while connecting to geth node: ', error);
          try {
            connect();
          } catch (err) {
            console.log('Error while creating new provider: ', err);
          }
          resolve(etherjsProvider);
        });
    }
  });
  return promise;
};

const faultToleranceGetProvider = cb => {
  const operation = retry.operation(config.RETRY_OPTIONS);
  operation.attempt(currentAttempt => {
    console.log(`Get Ethers.js Provider | Attempt: ${currentAttempt}`);
    return new Promise((resolve, reject) => {
      try {
        const provider = getProvider();
        resolve(cb(provider.error ? operation.mainError() : null, provider));
      } catch (error) {
        console.log(`Error while getting Ethers.js Provider: ${error}`);
        operation.retry(error);
        reject(error);
      }
    });
  });
};

const getProviderResolver = async () => {
  return new Promise((resolve, reject) => {
    faultToleranceGetProvider(async (err, provider) => {
      if (err) {
        console.log('Error in Get Provider Resolver:', err);
        reject(err);
      }
      resolve(provider);
    });
  });
};

/**
 * Returns a wallet using the given private key. The default key is privatekey using the default ganache seed.
 * @param {*} privateKey
 */
const getWallet = async privateKey => {
  const provider = await getProviderResolver();
  let wallet = null;
  try {
    wallet = new ethers.Wallet(privateKey, provider);
  } catch (e) {
    console.log('Failed to initialize Wallet', e);
  }
  return wallet;
};

/**
 * Gets the existing contract of a given type on the network.
 *
 * @param {String} contractName - name of contract
 * @param {String} contractAddress - address of the contract
 * @throws {ReferenceError} If contract doesn't exist, throws an exception.
 * @return {ethers.Contract} Returns contract object.
 */
const getContract = async (contractName, contractAddress) => {
  try {
    const contractJson = jsonfile.readFileSync(
      path.join(__dirname, './contracts/', `${contractName}.json`),
    );
    const provider = getProvider();
    return new ethers.Contract(contractAddress, contractJson.abi, provider);
  } catch (e) {
    throw new Error(`Failed to instantiate compiled contract ${contractName}`);
  }
};

/**
 * Gets the existing contract of a given type on the network.
 * @param {String} contractName - name of contract
 * @param contractAddress
 * @param {String} privateKey - signer address
 * @returns {Promise<Contract>}
 * @throws {ReferenceError} If contract doesn't exist, throws an exception.
 */

const getContractWithSigner = async (contractName, contractAddress, privateKey) => {
  try {
    const contractJson = jsonfile.readFileSync(
      path.join(__dirname, './contracts/', `${contractName}.json`),
    );

    const provider = getProvider();
    const contract = new ethers.Contract(contractAddress, contractJson.abi, provider);
    const wallet = await getWallet(privateKey);
    return contract.connect(wallet);
  } catch (e) {
    throw new Error(`Failed to instantiate compiled contract ${contractName}`);
  }
};

const faultTolerantGetInstance = (contractAddress, contractABI, provider, cb) => {
  const operation = retry.operation(config.RETRY_OPTIONS);
  operation.attempt(currentAttempt => {
    return new Promise((resolve, reject) => {
      try {
        const instance = new ethers.Contract(contractAddress, contractABI, provider);
        resolve(cb(instance.error ? operation.mainError() : null, instance));
      } catch (error) {
        operation.retry(error);
        reject(error);
      }
    });
  });
};

const getContractInstance = async (contractABI, contractAddress) => {
  try {
    const provider = await getProviderResolver();
    return new Promise((resolve, reject) => {
      faultTolerantGetInstance(contractAddress, contractABI, provider, async (err, instance) => {
        if (err) {
          console.log('Error in faultTolerantGetInstance:', err);
          reject(err);
        }
        resolve(instance);
      });
    });
  } catch (e) {
    throw new Error('Failed to instantiate');
  }
};

const getContractInstanceWithSigner = async (contractABI, contractAddress, privateKey) => {
  try {
    const provider = await getProviderResolver();
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const wallet = await getWallet(privateKey);
    return contract.connect(wallet);
  } catch (e) {
    throw new Error(`Failed to instantiate compiled contract ${contractAddress}`);
  }
};

const getTransactionCount = async address => {
  const provider = await getProvider();
  const transactionCount = await provider.getTransactionCount(address);
  return transactionCount;
};

const getSignedTx = async (transaction, privateKey) => {
  const wallet = await getWallet(privateKey);
  /* console.log({ wallet }); */
  // wallet.defaultGasLimit();
  const tx = {
    ...transaction,
    gasLimit: transaction.gasLimit || 100000000,
    nonce: transaction.nonce || (await getTransactionCount(wallet.address)),
  };
  return wallet.sign(tx);
};

const getUnsignedContractDeployment = (contractJson, args = []) => {
  try {
    const factory = new ethers.ContractFactory(contractJson.abi, contractJson.bytecode);
    const transaction = factory.getDeployTransaction(...args);
    return transaction.data;
  } catch (error) {
    throw error;
  }
};

const getBalance = async privateKey => {
  const wallet = await getWallet(privateKey);

  const { address } = wallet.signingKey;
  const provider = await getProviderResolver();
  return provider.getBalance(address).then(balance => {
    // balance is a BigNumber (in wei); format is as a string (in ether)
    return ethers.utils.commify(Number(ethers.utils.formatEther(balance)).toFixed(2));
  });
};

module.exports = {
  connect,
  getContractInstanceWithSigner,
  getWallet,
  getSignedTx,
  getProviderResolver,
  getContractInstance,
  getUnsignedContractDeployment,
  getBalance,
};
