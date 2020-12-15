const FinancialMapping = artifacts.require('./Token/Mapping/FinancialEntityMapping.sol');
const { BN, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const utils = require('dapp-utils');

contract('FinancialEntityMapping', () => {
  let financialEntityContract;

  before(async () => {
    financialEntityContract = await FinancialMapping.new();
  });

  describe('Create mapping and test retrieval', function() {
    const securityId = 'SC001';
    const secId = utils.utf8ToHex(securityId);
    const dateofMapping = '29/05/2020';
    const date = utils.utf8ToHex(dateofMapping);
    let nodeAddress = '0x692a70d2e424A56D2c6c27AA97D1a86395877b3c';
    const parentNodeAddress = '0x692A70D2e424a56D2c6C27Aa97d1A86395877b3B';
    const childNodeAddress1 = '0x692a70d2e424A56D2c6c27AA97D1a86395877B3D';
    const childNodeAddress2 = '0x0089d53F703f7E0843953D48133f74cE247184c2';
    const childNodeAddresses = [];
    childNodeAddresses.push(childNodeAddress1);
    childNodeAddresses.push(childNodeAddress2);
    const numeratorFirst = new BN(3);
    const numeratorSecond = new BN(5);
    const numerators = [];
    numerators.push(numeratorFirst);
    numerators.push(numeratorSecond);
    const denominator = new BN(8);
    it('Create Financial entity mapping in Blockchain - Add childs with a ratio', async () => {
      const { logs } = await financialEntityContract.addChildEntityMappings(
        secId,
        date,
        nodeAddress,
        parentNodeAddress,
        childNodeAddresses,
        numerators,
        denominator,
      );
      expectEvent.inLogs(logs, 'entityMappingsAdded', {
        securityId: secId,
        date,
        nodeAddress,
        parentNodeAddress,
        denominator,
      });
    });

    it('Read the user ratio mapping for one child node', async () => {
      nodeAddress = '0x692a70d2e424A56D2c6c27AA97D1a86395877b3c';
      const expectedChildCount = new BN(2);
      const childCount = await financialEntityContract.childCount(secId, date, nodeAddress);
      childCount.should.be.bignumber.equal(expectedChildCount);
      let count = 0;
      // get first child
      let nodeRatios = await financialEntityContract.childNodeDetails(
        secId,
        date,
        nodeAddress,
        count,
      );
      let childRatio = {};
      let index = 0;
      childRatio.nodeAddress = nodeRatios[index];
      index += 1;
      childRatio.numerator = nodeRatios[index];
      index += 1;
      childRatio.denominator = nodeRatios[index];
      childRatio.nodeAddress.should.be.equal(childNodeAddresses[count]);
      childRatio.numerator.should.be.bignumber.equal(numerators[count]);
      // get second child
      count += 1;
      nodeRatios = await financialEntityContract.childNodeDetails(secId, date, nodeAddress, count);
      childRatio = {};
      index = 0;
      childRatio.nodeAddress = nodeRatios[index];
      index += 1;
      childRatio.numerator = nodeRatios[index];
      index += 1;
      childRatio.denominator = nodeRatios[index];
      childRatio.nodeAddress.should.be.equal(childNodeAddresses[count]);
      childRatio.numerator.should.be.bignumber.equal(numerators[count]);
    });

    it('Create Financial entity mapping in Blockchain - Fails when the lengths of childs and ratios are different', async () => {
      numerators.push(new BN(2));
      await shouldFail.reverting(
        financialEntityContract.addChildEntityMappings(
          secId,
          date,
          nodeAddress,
          parentNodeAddress,
          childNodeAddresses,
          numerators,
          denominator,
        ),
      );
    });
  });
});
