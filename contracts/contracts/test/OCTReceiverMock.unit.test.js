const { BN, constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');

const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const OCTReceiverMock = artifacts.require('OCTReceiverMock');
const abi = require('ethereumjs-abi');
contract('OCTReceiverMock', function([_, account1, account2, account3]) {
  const selector = new BN('0x1e7aa84b');
  const operator = account1;
  const from = account2;
  const amount = new BN(1234);
  const encode = abi.rawEncode(['uint256'], ['123']);
  const data = `0x${encode.toString('hex')}`;

  beforeEach(async function() {
    this.contract = await OCTReceiverMock.new();
  });

  describe('when amount is > 0', function() {
    it('onOCTReceived should return 3324810851', async function() {
      const sel = await this.contract.onOCTReceived.call(operator, from, amount, data);
      expect(new BN(sel)).to.be.bignumber.equal(selector);
    });
  });

  describe('when amount is 0', function() {
    it('onOCTReceived should return 0', async function() {
      const sel = await this.contract.onOCTReceived.call(operator, from, new BN(0), data);
      expect(new BN(sel)).to.be.bignumber.equal(new BN(3300000000));
    });
  });
});
