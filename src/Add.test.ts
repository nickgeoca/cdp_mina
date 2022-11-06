import { Add } from './Add';
import {  CDP } from './CDP';
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

async function localDeploy(
  zkAppInstance: Add,
  zkAppPrivatekey: PrivateKey,
  deployerAccount: PrivateKey
) {
  const txn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkAppInstance.deploy({ zkappKey: zkAppPrivatekey });
    zkAppInstance.init();
    zkAppInstance.sign(zkAppPrivatekey);
  });
  await txn.send().wait();
}

describe('Add', () => {
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

  it('generates and deploys the `Add` smart contract', async () => {
    const zkAppInstance = new Add(zkAppAddress);
    await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);
    const num = zkAppInstance.num.get();
    expect(num).toEqual(Field.one);
  });

  it('correctly updates the num state on the `Add` smart contract', async () => {
    const zkAppInstance = new Add(zkAppAddress);
    await localDeploy(zkAppInstance, zkAppPrivateKey, deployerAccount);
    const txn = await Mina.transaction(deployerAccount, () => {
      zkAppInstance.update();
      zkAppInstance.sign(zkAppPrivateKey);
    });
    await txn.send().wait();

    const updatedNum = zkAppInstance.num.get();
    expect(updatedNum).toEqual(Field(3));
  });
});

async function localDeployCdp(
  zkAppInstance: Add,
  zkAppPrivatekey: PrivateKey,
  deployerAccount: PrivateKey
) {
  const txn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    zkAppInstance.deploy({ zkappKey: zkAppPrivatekey });
    zkAppInstance.init();
    zkAppInstance.sign(zkAppPrivatekey);
  });
  await txn.send().wait();
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

  it('generates and deploys the `Add` smart contract', async () => {
    const c_3 = new Add(zkAppAddress); await localDeployCdp(c_3, zkAppPrivateKey, deployerAccount);
    const c_2 = new Add(zkAppAddress); await localDeployCdp(c_2, zkAppPrivateKey, deployerAccount);
    const c_1 = new Add(zkAppAddress); await localDeployCdp(c_1, zkAppPrivateKey, deployerAccount);
    const c0 = new Add(zkAppAddress);  await localDeployCdp(c0, zkAppPrivateKey, deployerAccount);
    const c1 = new Add(zkAppAddress);  await localDeployCdp(c1, zkAppPrivateKey, deployerAccount);
    const c2 = new Add(zkAppAddress);  await localDeployCdp(c2, zkAppPrivateKey, deployerAccount);
    const c3 = new Add(zkAppAddress);  await localDeployCdp(c3, zkAppPrivateKey, deployerAccount);

    const u1 = new Add(zkAppAddress);  await localDeployCdp(u1, zkAppPrivateKey, deployerAccount);
    console.log('blah')
    /*
    print(f'->event, 1 MINA = ${1*1.1**2}')
    c2.set_liquidated()
    c3.set_liquidated()
    u1.change_usd(100, 43);                               assert u1.usd_minted == 43 and u1.is_liquidated() == False
    
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
