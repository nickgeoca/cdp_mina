import { Add, } from './Add';
import {  LiquidationBin, UserCollateral } from './CDP';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
} from 'snarkyjs';

/*
 * This file specifies how to test the `Add` example smart contract. It is safe to delete this file and replace
 * with your own tests.
 *
 * See https://docs.minaprotocol.com/zkapps for more info.
 */

function createLocalBlockchain() {
  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  return Local.testAccounts[0].privateKey;
}

async function deployLiquidationBin(
  zkAppAddress: PublicKey,
  liquidationPrice: Field,
  zkAppPrivatekey: PrivateKey,
  deployerAccount: PrivateKey
) {
  const lbInstance = new LiquidationBin(zkAppAddress);
  const txn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    lbInstance.init(liquidationPrice);
    lbInstance.sign(zkAppPrivatekey);
  });
  await txn.send().wait();
  return lbInstance;
}

async function deployUserCollateral(
  zkAppAddress: PublicKey,
  liqContract: PublicKey,
  zkAppPrivatekey: PrivateKey,
  deployerAccount: PrivateKey
) {
  const userCollInstance = new UserCollateral(zkAppAddress);
  const txn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    userCollInstance.init(liqContract);
    userCollInstance.sign(zkAppPrivatekey);
  });
  await txn.send().wait();
  return userCollInstance;
}

describe('CDP', () => {
  let deployerAccount: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey;

  beforeEach(async () => {
    await isReady;
    deployerAccount = createLocalBlockchain();
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
  });

  afterAll(async () => {
    // `shutdown()` internally calls `process.exit()` which will exit the running Jest process early.
    // Specifying a timeout of 0 is a workaround to defer `shutdown()` until Jest is done running all tests.
    // This should be fixed with https://github.com/MinaProtocol/mina/issues/10943
    setTimeout(shutdown, 0);
  });

  it('passes CDP test', async () => {
    const [p_3,p_2,p_1,p0,p1,p2,p3] = [7,8,9,10,11,12,13]
    const lb_3 = await deployLiquidationBin(zkAppAddress, Field(p_3), zkAppPrivateKey, deployerAccount);
    const lb_2 = await deployLiquidationBin(zkAppAddress, Field(p_2), zkAppPrivateKey, deployerAccount);
    const lb_1 = await deployLiquidationBin(zkAppAddress, Field(p_1), zkAppPrivateKey, deployerAccount);
    const lb0 = await deployLiquidationBin(zkAppAddress, Field(p0), zkAppPrivateKey, deployerAccount);
    const lb1 = await deployLiquidationBin(zkAppAddress, Field(p1), zkAppPrivateKey, deployerAccount);
    const lb2 = await deployLiquidationBin(zkAppAddress, Field(p2), zkAppPrivateKey, deployerAccount);
    const lb3 = await deployLiquidationBin(zkAppAddress, Field(p3), zkAppPrivateKey, deployerAccount);

    const u1 = await deployUserCollateral(zkAppAddress, lb1.address, zkAppPrivateKey, deployerAccount);
    console.log('->event, 1 MINA = $${1*1.1**2}')
    lb3.liquidate();
    lb2.liquidate()
    u1.changeUsd(Field(100), Field(43)); // assert u1.usd_minted == 43 and u1.is_liquidated() == False
/*    
    print(f'->event, 1 MINA = ${1*1.1**1}')
    c1.set_liquidated();                                  assert u1.usd_minted == 43 and u1.is_liquidated() == True
    fails(lambda: u1.change_usd(1000, 0));                assert u1.usd_minted == 43 and u1.is_liquidated() == True
    fails(lambda: u1.change_contract(c2, u1.usd_minted)); assert u1.usd_minted == 43 and u1.is_liquidated() == True
    
    print(f'->event, 1 MINA = ${1*1.1**1}')
    u1.liquidate_and_reset(100);                          assert u1.usd_minted == 0 and u1.is_liquidated() == False
    u1.change_contract(c_2, 0)
    u1.change_usd(100, 63);                               assert u1.usd_minted == 63 and u1.is_liquidated() == False
    u1.change_usd(0, -5);                                 assert u1.usd_minted == 58 and u1.is_liquidated() == False
    
    print(f'->event, 1 MINA = ${1*1.1**-1}')
    u1.change_contract(c_3, 58);                          assert u1.usd_minted == 52 and u1.is_liquidated() == False
    c2.set_liquidated();                                  assert u1.usd_minted == 52 and u1.is_liquidated() == False
    */
  });
});
