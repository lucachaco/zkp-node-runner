import NonFungibleCommitmentSchema from '../models/nonFungibleCommitment.model';

/**
 *
 * @param {any} data
 */
const create = async data => {
  const newNonFungibleCommitment = new NonFungibleCommitmentSchema(data);
  return newNonFungibleCommitment.save();
};

const update = async (commitment, data) => {
  return NonFungibleCommitmentSchema.update({ commitment }, { $set: data });
};

const listAll = (filter = {}, sort = {}) => {
  return NonFungibleCommitmentSchema.find(filter)
    .sort(sort)
    .lean()
    .exec();
};

const findOne = tokenId => {
  return NonFungibleCommitmentSchema.findOne({ tokenId })
    .lean()
    .exec();
};

export { create, listAll, update, findOne };
