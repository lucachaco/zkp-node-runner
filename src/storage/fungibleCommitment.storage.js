import FungibleCommitmentsSchema from '../models/fungibleCommitment.model';

const findOneById = async id => {
  const fungibleCommitment = await FungibleCommitmentsSchema.findOne({ commitment: id })
    .lean()
    .exec();
  return fungibleCommitment;
};

const create = data => {
  const newFungibleCommitment = new FungibleCommitmentsSchema(data);
  return newFungibleCommitment.save();
};

const listAll = (filter = {}, sort = {}) => {
  return FungibleCommitmentsSchema.find(filter)
    .sort(sort)
    .lean()
    .exec();
};

const update = async (commitment, data) => {
  return FungibleCommitmentsSchema.updateOne({ commitment }, { $set: data });
};

const count = async (filter = {}) => {
  return FungibleCommitmentsSchema.countDocuments({ filter }).exec();
};

export { create, listAll, update, findOneById, count };
