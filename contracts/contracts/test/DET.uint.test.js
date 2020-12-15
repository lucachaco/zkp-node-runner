const { BN, constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const ethers = require('ethers');

const { ZERO_ADDRESS } = constants;
const DET = artifacts.require('DET');
const FET = artifacts.require('FET');

contract('DET', function([_, initialHolder, recipient, anotherAccount]) {
  const initialSupply = new BN(100);
  const amount = new BN(10);

  describe('setFET', function() {
    beforeEach(async function() {
      this.token = await DET.new();
    });

    describe('when FET contract is incorrect', async function() {
      it('reverts', async function() {
        // await this.token.setFet(ZERO_ADDRESS);
        await shouldFail.reverting(this.token.getFetBalance(initialHolder, ZERO_ADDRESS));
      });
    });

    describe('when FET contract is correct', async function() {
      // describe('when not executed by contract owner', async function() {
      //   it('reverts', async function() {
      //     this.FET = await FET.new('FungibleEventToken', 'FET', 2, initialHolder, initialSupply, {
      //       from: _, // Made explicit on purpose
      //     });
      //     await shouldFail.reverting(this.token.setFet(this.FET.address, { from: anotherAccount }));
      //   });
      // });

      describe('when executed by contract owner', async function() {
        it('accepts an FET contract address', async function() {
          this.FET = await FET.new('FungibleEventToken', 'FET', 2, initialHolder, initialSupply, {
            from: _,
            // Made explicit on purpose. For remaining cases we will _ implicitly
          });
          // await this.token.setFet(this.FET.address, { from: _ });
          (await this.token.getFetBalance(
            initialHolder,
            this.FET.address,
          )).should.be.bignumber.equal('100');
          (await this.token.getFetBalance(recipient, this.FET.address)).should.be.bignumber.equal(
            '0',
          );
        });
      });
    });
  });

  describe('mint', function() {
    beforeEach(async function() {
      this.token = await DET.new();
      this.FET = await FET.new('OpsCoin', 'FET', 2, initialHolder, initialSupply);
      // await this.token.setFet(this.FET.address);
    });

    describe('FET', function() {
      it('could burn', async function() {
        await this.FET.burn(initialHolder, amount);
        (await this.FET.balanceOf(initialHolder)).should.be.bignumber.equal('90');
      });
    });

    describe('when sender is zero address', function() {
      it('revert', async function() {
        await shouldFail.reverting(
          this.token.mint(
            ZERO_ADDRESS,
            1,
            ethers.utils.formatBytes32String('FRA'),
            ethers.utils.formatBytes32String('STATUS'),
            ethers.utils.formatBytes32String('S1'),
            2,
            ethers.utils.formatBytes32String('14-06-2018'),
            amount,
            this.FET.address,
            1,
          ),
        );
      });
    });

    describe('when sender is not zero address', function() {
      describe('when sender has zero balance', function() {
        it('revert', async function() {
          await shouldFail.reverting(
            this.token.mint(
              recipient,
              1,
              ethers.utils.formatBytes32String('FRA'),
              ethers.utils.formatBytes32String('STATUS'),
              ethers.utils.formatBytes32String('S1'),
              2,
              ethers.utils.formatBytes32String('14-06-2018'),
              amount,
              this.FET.address,
              1,
            ),
          );
        });
      });

      describe('when sender and msg.sender do not match', function() {
        it('revert', async function() {
          await shouldFail.reverting(
            this.token.mint(
              initialHolder,
              1,
              ethers.utils.formatBytes32String('FRA'),
              ethers.utils.formatBytes32String('STATUS'),
              ethers.utils.formatBytes32String('S1'),
              2,
              ethers.utils.formatBytes32String('14-06-2018'),
              amount,
              this.FET.address,
              1,
              {
                from: anotherAccount,
              },
            ),
          );
        });
      });

      describe('when duplicate tokenId is passed', function() {
        it('revert', async function() {
          await this.token.mint(
            initialHolder,
            1,
            ethers.utils.formatBytes32String('FRA'),
            ethers.utils.formatBytes32String('STATUS'),
            ethers.utils.formatBytes32String('S1'),
            2,
            ethers.utils.formatBytes32String('14-06-2018'),
            amount,
            this.FET.address,
            1,
            {
              from: initialHolder,
            },
          );
          await shouldFail.reverting(
            this.token.mint(
              initialHolder,
              1,
              ethers.utils.formatBytes32String('FRA'),
              ethers.utils.formatBytes32String('STATUS'),
              ethers.utils.formatBytes32String('S1'),
              2,
              ethers.utils.formatBytes32String('14-06-2018'),
              amount,
              this.FET.address,
              1,
              {
                from: initialHolder,
              },
            ),
          );
        });
      });

      describe('when mint coin with positive balance account', function() {
        it('should burn FET', async function() {
          await this.token.mint(
            initialHolder,
            1,
            ethers.utils.formatBytes32String('FRA'),
            ethers.utils.formatBytes32String('STATUS'),
            ethers.utils.formatBytes32String('S1'),
            2,
            ethers.utils.formatBytes32String('14-06-2018'),
            amount,
            this.FET.address,
            1,
            {
              from: initialHolder,
            },
          );
          (await this.FET.balanceOf(initialHolder)).should.be.bignumber.equal('90');
        });

        it('should emit Transfer event', async function() {
          const { logs } = await this.token.mint(
            initialHolder,
            1,
            ethers.utils.formatBytes32String('FRA'),
            ethers.utils.formatBytes32String('STATUS'),
            ethers.utils.formatBytes32String('S1'),
            2,
            ethers.utils.formatBytes32String('14-06-2018'),
            amount,
            this.FET.address,
            1,
            {
              from: initialHolder,
            },
          );
          expectEvent.inLogs(logs, 'Transfer', {
            from: ZERO_ADDRESS,
            to: initialHolder,
            tokenId: new BN(1),
          });
        });

        it('should return correct token owner of minted token', async function() {
          await this.token.mint(
            initialHolder,
            1,
            ethers.utils.formatBytes32String('FRA'),
            ethers.utils.formatBytes32String('STATUS'),
            ethers.utils.formatBytes32String('S1'),
            2,
            ethers.utils.formatBytes32String('14-06-2018'),
            amount,
            this.FET.address,
            1,
            {
              from: initialHolder,
            },
          );
          const owner = await this.token.ownerOf(1);
          assert.equal(initialHolder, owner);
        });
      });
    });
  });

  describe('burn', function() {
    beforeEach(async function() {
      this.token = await DET.new();
      this.FET = await FET.new('FungibleEventToken', 'FET', 2, initialHolder, initialSupply);
      // await this.token.setFet(this.FET.address);
      await this.token.mint(
        initialHolder,
        1,
        ethers.utils.formatBytes32String('FRA'),
        ethers.utils.formatBytes32String('STATUS'),
        ethers.utils.formatBytes32String('S1'),
        2,
        ethers.utils.formatBytes32String('14-06-2018'),
        amount,
        this.FET.address,
        1,
        {
          from: initialHolder,
        },
      );
      await this.token.setPrivateData(1, ethers.utils.formatBytes32String('Mock data'));
    });

    describe('when non-exist tokenId is passed', async function() {
      it('revert', async function() {
        await shouldFail.reverting(this.token.burn(2));
      });
    });

    describe('when unauthorized account executes', async function() {
      it('revert', async function() {
        await shouldFail.reverting(this.token.burn(1, { from: anotherAccount }));
      });
    });

    describe('when authorized account burns correct tokenId', async function() {
      it('should nullify token ownership', async function() {
        const owner = await this.token.ownerOf(1);
        assert.equal(initialHolder, owner);
        await this.token.burn(1, { from: initialHolder });
        await shouldFail.reverting(this.token.ownerOf(1));
      });

      it('should destroy token detail information', async function() {
        const privateData = await this.token.getPrivateData(1);
        assert.equal(ethers.utils.formatBytes32String('Mock data'), privateData);
        await this.token.burn(1, { from: initialHolder });
        await shouldFail.reverting(this.token.getPrivateData(1));
      });

      it('should emit event', async function() {
        const { logs } = await this.token.burn(1, { from: initialHolder });
        expectEvent.inLogs(logs, 'Transfer', {
          from: initialHolder,
          to: ZERO_ADDRESS,
          tokenId: new BN(1),
        });
      });
    });
  });

  describe('getPrivateData', function() {
    beforeEach(async function() {
      this.token = await DET.new();
      this.FET = await FET.new('FungibleEventToken', 'FET', 2, initialHolder, initialSupply);
      // await this.token.setFet(this.FET.address);
    });

    describe('when correct id is passed', function() {
      it('should return token private data', async function() {
        await this.token.mint(
          initialHolder,
          1,
          ethers.utils.formatBytes32String('FRA'),
          ethers.utils.formatBytes32String('STATUS'),
          ethers.utils.formatBytes32String('S1'),
          2,
          ethers.utils.formatBytes32String('14-06-2018'),
          amount,
          this.FET.address,
          1,
          {
            from: initialHolder,
          },
        );
        await this.token.setPrivateData(1, ethers.utils.formatBytes32String('Mock data'));
        const privateData = await this.token.getPrivateData(1);
        assert.equal(ethers.utils.formatBytes32String('Mock data'), privateData);
      });
    });

    describe('when non-exist id is passed', function() {
      it('revert', async function() {
        await shouldFail.reverting(this.token.getPrivateData(2));
      });
    });

    describe('when multiple tokens exist, and correct id is passed', function() {
      it('should return token private data', async function() {
        await this.token.mint(
          initialHolder,
          1,
          ethers.utils.formatBytes32String('FRA'),
          ethers.utils.formatBytes32String('STATUS'),
          ethers.utils.formatBytes32String('S1'),
          2,
          ethers.utils.formatBytes32String('14-06-2018'),
          amount,
          this.FET.address,
          1,
          {
            from: initialHolder,
          },
        );
        await this.token.setPrivateData(1, ethers.utils.formatBytes32String('Mock data 1'));
        await this.token.mint(
          initialHolder,
          2,
          ethers.utils.formatBytes32String('GER'),
          ethers.utils.formatBytes32String('STATUS'),
          ethers.utils.formatBytes32String('S1'),
          2,
          ethers.utils.formatBytes32String('14-06-2018'),
          amount,
          this.FET.address,
          1,
          {
            from: initialHolder,
          },
        );
        await this.token.setPrivateData(2, ethers.utils.formatBytes32String('Mock data 2'));
        const privateData = await this.token.getPrivateData(2);
        assert.equal(ethers.utils.formatBytes32String('Mock data 2'), privateData);
      });
    });
  });

  describe('getPublicData', function() {
    beforeEach(async function() {
      this.token = await DET.new();
      this.FET = await FET.new('FungibleEventToken', 'FET', 2, initialHolder, initialSupply);
      // await this.token.setFet(this.FET.address);
      await this.token.mint(
        initialHolder,
        1,
        ethers.utils.formatBytes32String('FRA'),
        ethers.utils.formatBytes32String('STATUS'),
        ethers.utils.formatBytes32String('S1'),
        2,
        ethers.utils.formatBytes32String('14-06-2018'),
        amount,
        this.FET.address,
        1,
        {
          from: initialHolder,
        },
      );
    });

    describe('when correct id is passed', function() {
      it('should return correct token public data', async function() {
        const publicData = await this.token.getPublicData(1);
        assert.equal(ethers.utils.formatBytes32String('FRA'), publicData[1]);
        assert.equal(ethers.utils.formatBytes32String('STATUS'), publicData[2]);
      });
    });

    describe('when non-exist id is passed', function() {
      it('revert', async function() {
        await shouldFail.reverting(this.token.getPublicData(2));
      });
    });
  });

  describe('setWithholdingTax', function() {
    beforeEach(async function() {
      this.token = await DET.new();
      this.FET = await FET.new('FungibleEventToken', 'FET', 2, initialHolder, initialSupply);
      // await this.token.setFet(this.FET.address);
      await this.token.mint(
        initialHolder,
        1,
        ethers.utils.formatBytes32String('FRA'),
        ethers.utils.formatBytes32String('STATUS'),
        ethers.utils.formatBytes32String('S1'),
        2,
        ethers.utils.formatBytes32String('14-06-2018'),
        amount,
        this.FET.address,
        1,
        {
          from: initialHolder,
        },
      );
    });

    describe('when not approved', function() {
      it('reverts', async function() {
        await shouldFail.reverting(this.token.setWithholdingTax(1, 100, { from: anotherAccount }));
      });
    });

    describe('when approved', function() {
      it('should update the withholding tax correctly', async function() {
        await this.token.approve(anotherAccount, 1, { from: initialHolder });
        await this.token.setWithholdingTax(1, 100, { from: anotherAccount });
        const tax = await this.token.getWithholdingTax(1);
        assert.equal(100, tax);
      });

      it('should emit an event', async function() {
        await this.token.approve(anotherAccount, 1, { from: initialHolder });
        const { logs } = await this.token.setWithholdingTax(1, 100, { from: anotherAccount });
        expectEvent.inLogs(logs, 'UpdateTax', {
          tokenId: new BN(1),
        });
      });
    });
  });
});

// describe('Test ether.js', async function() {
//   it('should burn', async function(){
//     let httpProvider = new ethers.providers.JsonRpcProvider();

//     let detJson = require('../../build/contracts/DET.json')
//     let detAbi = detJson.abi;
//     let detBytecode = detJson.bytecode;

//     let octJson = require('../../build/contracts/FET.json')
//     let octAbi = octJson.abi;
//     let octBytecode = octJson.bytecode;

//     let privateKey = '0x1efc8c8e704d1710f12f702a5c6528e8aa4391d7da0c348e7072ef60d80d138c';
//     let wallet = new ethers.Wallet(privateKey, httpProvider);

//     let factory = new ethers.ContractFactory(detAbi, detBytecode, wallet);
//     let token = await factory.deploy();
//     await token.deployed()

//     let accounts = await web3.eth.getAccounts();

//     factory = new ethers.ContractFactory(octAbi, octBytecode, wallet);
//     let oct = await factory.deploy('OpsCoin', 'FET', 2, accounts[0], 100);
//     await oct.deployed();

//     token = await token.connect(wallet);
//     oct = await oct.connect(wallet);

//     let tx = await token.setFet(oct.address);
//     await tx.wait();
//     console.log(await oct.balanceOf(accounts[0]));

//     let tx1 = await token.mint(accounts[0], 100, ethers.utils.formatBytes32String('Mock data'), 10);
//     await tx1.wait();
//     let balance = await oct.balanceOf(accounts[0]);
//     balance.should.equal(new BN(90));
//   });
// });
