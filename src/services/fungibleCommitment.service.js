import { randomHex, hexToDec } from 'zkp-utils';
import { transfer, burn, mint } from '../helper/fungibleCommitment.helper';
import {
  getLastTwoActiveCommitments,
  setBurned,
  setTransferred,
  getCommitmentById,
  getActiveCommitmentsCount,
  getAllActiveCommitments,
  getAllActiveInvestorCommitments,
} from '../helper/commitment.helper';
import { create as persistCommitment } from '../storage/fungibleCommitment.storage';
import { toPrecision, fromPrecision } from '../utils';
import { retryProcess } from '../contractHelpers/retryUtil';
import config from '../config';

/**
 * @param amount
 * @param zkpPrivateKey
 * @param fTokenShieldAddress
 * @param account
 * @returns {Promise<Promise<*>|*>}
 */
const mintFungibleCommitment = async (
  amount,
  zkpPrivateKey,
  fTokenShieldAddress,
  erc20Address,
  account,
) => {
  const salt = await randomHex(32);
  const mintResponse = await retryProcess(
    () =>
      mint(
        toPrecision(amount, config.DECIMAL_PLACES),
        zkpPrivateKey,
        salt,
        fTokenShieldAddress,
        erc20Address,
        account,
      ),
    'Mint Private ERC20',
  );
  const persistResponse = await persistCommitment({
    salt,
    value: amount,
    ...mintResponse,
    isMinted: true,
  });
  return { mintResponse, persistResponse };
};

/**
 * @returns {Promise<Promise<*>|*>}
 * @param amount
 * @param zkpPrivateKey
 * @param zkpPublicKey
 * @param fTokenShieldAddress
 * @param account

 */
const transferFungibleCommitment = async (
  amount,
  zkpPrivateKey,
  zkpPublicKey,
  fTokenShieldAddress,
  erc20Address,
  account,
  toEntity,
) => {
  const lastTwoCommitments = await getLastTwoActiveCommitments(amount);
  const precisedBalanceA = toPrecision(lastTwoCommitments.commitmentA.value, config.DECIMAL_PLACES);
  const precisedBalanceB = toPrecision(lastTwoCommitments.commitmentB.value, config.DECIMAL_PLACES);
  const precisedSendingAmount = toPrecision(amount, config.DECIMAL_PLACES);
  const c = {
    commitmentA: {
      balance: precisedBalanceA,
      salt: lastTwoCommitments.commitmentA.salt,
      id: lastTwoCommitments.commitmentA.commitment,
      index: lastTwoCommitments.commitmentA.commitmentIndex,
    },

    commitmentB: {
      balance: precisedBalanceB,
      salt: lastTwoCommitments.commitmentB.salt,
      id: lastTwoCommitments.commitmentB.commitment,
      index: lastTwoCommitments.commitmentB.commitmentIndex,
    },
    sendingAmount: precisedSendingAmount,
    receiverPublicKey: zkpPublicKey,
    senderSecretKey: zkpPrivateKey,
    fTokenShieldAddress,
    account,
  };
  console.log({ c });
  const transferResponse = await retryProcess(
    () =>
      transfer(
        c.commitmentA,
        c.commitmentB,
        c.sendingAmount,
        zkpPublicKey,
        zkpPrivateKey,
        fTokenShieldAddress,
        erc20Address,
        account,
      ),
    'Transfer Private ERC20',
  );
  const changeCommitment = transferResponse.outputCommitments[1];
  changeCommitment.value = hexToDec(changeCommitment.value);
  changeCommitment.value = fromPrecision(changeCommitment.value, config.DECIMAL_PLACES);
  console.log({ changeCommitment });

  const nullifiedResponseA = setTransferred(c.commitmentA.id, toEntity);
  const nullifiedResponseB = setTransferred(c.commitmentB.id, toEntity);
  const createChangeResponse = await persistCommitment({ ...changeCommitment, isChange: true });

  const newCommitment = transferResponse.outputCommitments[0];
  newCommitment.value = hexToDec(newCommitment.value);
  newCommitment.value = fromPrecision(newCommitment.value, config.DECIMAL_PLACES);

  return {
    transferResponse,
    nullifiedResponseA,
    nullifiedResponseB,
    createChangeResponse,
    newCommitment,
  };
};

/**
 *  NON ATOMIC, might burn just part of the passed amount.
 * @param id
 * @param zkpPrivateKey
 * @param fTokenShieldAddress
 * @param account
 * @returns {any[]}
 */
const burnFungibleCommitmentById = async (
  id,
  zkpPrivateKey,
  fTokenShieldAddress,
  erc20Address,
  account,
) => {
  const commitment = await getCommitmentById(id);
  const burnResponse = await retryProcess(
    () =>
      burn(
        toPrecision(commitment.value, config.DECIMAL_PLACES),
        zkpPrivateKey,
        commitment.salt,
        commitment.commitment,
        commitment.commitmentIndex,
        fTokenShieldAddress,
        erc20Address,
        account,
      ),
    'Burn Private ERC20',
  );
  const updateResponse = setBurned(commitment.commitment);
  // TODO check burnResponse for value
  return { burnResponse, updateResponse };
};

export {
  burnFungibleCommitmentById,
  transferFungibleCommitment,
  mintFungibleCommitment,
  getActiveCommitmentsCount,
  getAllActiveCommitments,
  getAllActiveInvestorCommitments,
};
