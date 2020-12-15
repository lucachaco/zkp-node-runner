const FinancialEntity = artifacts.require('./FinancialEntityRegistry.sol');
const { expectEvent } = require('openzeppelin-test-helpers');
const utils = require('dapp-utils');

contract('Financial Entity', () => {
  let financialEntityContract;
  const financialEntityAddress = '0x692a70D2e424a56D2C6C27aA97D1a86395877b3A';
  const expectedFinancialEntityCode = 'AMCD01';
  const expectedName = 'FinancialEntity';
  const expectedCor = 'Fincor';
  const expectedBusinessCode = 'FinBcode';
  const expectedEntityCode = 'AM';

  const financialEntityCode = utils.utf8ToHex(expectedFinancialEntityCode);
  const name = utils.utf8ToHex(expectedName);
  const cor = utils.utf8ToHex(expectedCor);
  const businessIdentifierCode = utils.utf8ToHex(expectedBusinessCode);
  const entityCode = utils.utf8ToHex(expectedEntityCode);

  const financialEntityDetails = [
    financialEntityCode,
    name,
    cor,
    businessIdentifierCode,
    entityCode,
  ];
  before(async () => {
    financialEntityContract = await FinancialEntity.new();
  });

  describe('Financial entity registration and retrieval - Add fund manager', function() {
    it('Register financial entity', async () => {
      const { logs } = await financialEntityContract.register(
        financialEntityAddress,
        financialEntityDetails,
      );
      expectEvent.inLogs(logs, 'financialEntityRegistered', {
        financialEntity: financialEntityAddress,
      });
    });

    it('Read the financial entity from Blockchain - Read the fund manager', async () => {
      const financialEntity = await financialEntityContract.getFinancialEntity(
        financialEntityAddress,
      );
      let index = 0;
      const actualFinancialEntityCode = utils.hexToUtf8(financialEntity[index]);
      index += 1;
      const actualFinancialEntityName = utils.hexToUtf8(financialEntity[index]);
      index += 1;
      const actualFinancialEntityCor = utils.hexToUtf8(financialEntity[index]);
      index += 1;
      const actualFinancialEntityBiCode = utils.hexToUtf8(financialEntity[index]);
      index += 1;
      const actualEntityCode = utils.hexToUtf8(financialEntity[index]);
      actualFinancialEntityCode.should.be.equal(expectedFinancialEntityCode);
      actualFinancialEntityName.should.be.equal(expectedName);
      actualFinancialEntityCor.should.be.equal(expectedCor);
      actualFinancialEntityBiCode.should.be.equal(expectedBusinessCode);
      actualEntityCode.should.be.equal(expectedEntityCode);
    });
  });
});
