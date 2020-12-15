const FinancialEntityGeneric = artifacts.require('./FinancialEntityGeneric.sol');
const { expectEvent } = require('openzeppelin-test-helpers');
const utils = require('dapp-utils');

contract('Generic Financial Entity', () => {
  let financialEntityGenericContract;
  const entityData = {
    financialEntityCode: 'AMCD01',
    name: 'financialentity',
    cor: 'Fincor',
    businessCode: 'FinBcode',
  };
  const financialEntityAddress = '0x692a70D2e424a56D2C6C27aA97D1a86395877b3A';
  const expectedEntityCode = 'AM';

  const expectedEntityData = JSON.stringify(entityData);
  const entityCode = utils.utf8ToHex(expectedEntityCode);

  before(async () => {
    financialEntityGenericContract = await FinancialEntityGeneric.new();
  });

  describe('Generic Financial entity registration and retrieval - Add fund manager', function() {
    it('Register financial entity', async () => {
      const { logs } = await financialEntityGenericContract.register(
        financialEntityAddress,
        entityCode,
        expectedEntityData,
      );
      expectEvent.inLogs(logs, 'financialEntityRegistered', {
        financialEntity: financialEntityAddress,
      });
    });

    it('Read the generic financial entity from Blockchain - Read the fund manager', async () => {
      const financialEntity = await financialEntityGenericContract.getFinancialEntity(
        financialEntityAddress,
      );
      let index = 0;
      const actualEntityCode = utils.hexToUtf8(financialEntity[index]);
      index += 1;
      const actualEntityData = financialEntity[index];
      actualEntityData.should.be.equal(expectedEntityData);
      actualEntityCode.should.be.equal(expectedEntityCode);
    });
  });
});
