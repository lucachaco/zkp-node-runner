import { listAll, update, findOneById, count } from '../storage/fungibleCommitment.storage';

import { logger } from '../logger';
import { getSettingByKey } from '../services/settings.service';

const setMinted = async commitment => {
  try {
    return update(commitment, { isMinted: true });
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const setTransferred = async (commitment, toEntity) => {
  try {
    const entityCode = await getSettingByKey('ENTITY_CODE');
    logger.debug(`Transferring and nullifying commitment: ${commitment}`);
    return update(commitment, {
      isNullified: true,
      isTransferred: true,
      transferAudit: `Transfer and nullified by ${entityCode} to ${toEntity}`,
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const setNullified = async commitment => {
  try {
    return update(commitment, { isNullified: true });
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const setBurned = async commitment => {
  const entityCode = await getSettingByKey('ENTITY_CODE');
  try {
    return update(commitment, {
      isNullified: true,
      isBurned: true,
      burnAudit: `Burn and nullified by ${entityCode}`,
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const getCommitmentById = async id => {
  const commitment = await findOneById(id);
  if (!commitment) {
    throw new Error('Commitment not found');
  }
  return commitment;
};

const getLastCommitment = async () => {
  const commitments = await listAll({}, { commitmentIndex: 1 });
  if (commitments.length === 0) {
    return null;
  }
  return commitments[commitments.length - 1];
};

const getActiveCommitmentsCount = async () => {
  return count({ isNullified: false, isTransferred: false });
};

const getAllActiveCommitments = async () => {
  return listAll({ isNullified: false, isTransferred: false });
};

const getAllActiveNonInvestorCommitments = async () => {
  return listAll({ isNullified: false, investorTokens: false }, { value: 1 });
};

const getAllActiveInvestorCommitments = async () => {
  return listAll({ isNullified: false, investorTokens: true });
};

const getLastTwoActiveCommitments = async amount => {
  const commitments = await getAllActiveNonInvestorCommitments();
  if (commitments.length < 2) {
    throw new Error('At least 2 active commitments are required.');
  }
  const index = commitments.reduce((acc, commitment, i) => {
    if (i > 0 && commitment.value + commitments[i - 1].value >= amount) {
      return i - 1;
    }
    return acc;
  }, -1);
  if (index === -1) {
    throw new Error(`No two commitments are enough for amount: ${amount}`);
  }
  return { commitmentA: commitments[index], commitmentB: commitments[index + 1] };
};

export {
  setBurned,
  setMinted,
  setTransferred,
  setNullified,
  getCommitmentById,
  getLastTwoActiveCommitments,
  getLastCommitment,
  getActiveCommitmentsCount,
  getAllActiveCommitments,
  getAllActiveNonInvestorCommitments,
  getAllActiveInvestorCommitments,
};
