import {
  Field,
  SmartContract,
  PublicKey,
  state,
  State,
  Bool,
  method,
  DeployArgs,
  Mina,
} from 'snarkyjs';


/*
TODO
 - Batch txs
 - Incewntivize depositing DAI better during liquidaiton
 - Deposit DAI into liquidation bin to scale better during liquidatin 
 - Oracle
 - interest rates?
 - OBO feature. risk parameters. how to do en-masse
 - equivilent to buy mina thru liquiation. same thing as buying on a DEX
 - treat it as a wallet? if the User circuits are in there, then it's good. has liquidateAndReset
LOW HANGING
 - (?) chain the LiquidationBin contracts together.. then pass the number of contracts away when switching contracts
*/


export class LiquidationBin extends SmartContract {
  @state(Field) liquidationPrice = State<Field>();
  @state(Field) liquidationTime = State<Field>();
  @state(Field) unLiquidationTime = State<Field>();
  @method init(liquidationPrice: Field) { this.liquidationPrice.set(liquidationPrice);                        }
  @method liquidate()                   { this.liquidationTime.set(Mina.getNetworkState().timestamp.value);   }
  @method unliquidate()                 { this.unLiquidationTime.set(Mina.getNetworkState().timestamp.value); }  
  @method isUnderWater() : Bool { 
    const liquidationTime = this.liquidationTime.get();
    const unLiquidationTime = this.unLiquidationTime.get();

    return Bool(liquidationTime > unLiquidationTime);         
  }  
}

export class UserCollateral extends SmartContract {
  @state(Field) liqContract = State<PublicKey>();
  @state(Field) usdMinted = State<Field>();
  @state(Field) minaDeposited = State<Field>();
  @state(Field) lastUpdate = State<Field>();

  @method init(liqContract: PublicKey) { this.liqContract.set(liqContract); }
  @method isLiquidated(): Bool { 
    const lastUpdate = this.lastUpdate.get();
    const usdMinted = this.usdMinted.get();
    const liqContract = new LiquidationBin(this.liqContract.get())

    return Bool(liqContract.liquidationTime.get() > lastUpdate && usdMinted != Field(0)); 
  }
  @method changeUsd(incomingMina: Field, outgoingUsd: Field) {
    const usdMinted = this.usdMinted.get();
    const liqContract = new LiquidationBin(this.liqContract.get())

    // asserts
    incomingMina.div(liqContract.liquidationPrice.get()).assertGt(outgoingUsd);
    this.isLiquidated().assertFalse();

    // state updates
    this.usdMinted.set(usdMinted.add(outgoingUsd));
    this.lastUpdate.set(Mina.getNetworkState().timestamp.value);
    // TODO, send back leftover MINAs
  }
  @method changeLiqContract(newLiqContractPubKey: PublicKey, depositUsd: Field) { 
    // vars
    const oldLiqContract = new LiquidationBin(this.liqContract.get());
    const newLiqContract = new LiquidationBin(newLiqContractPubKey);

    // asserts
    this.usdMinted.assertEquals(depositUsd);     // must cover the whole thing
    this.isLiquidated().assertFalse();     // not liquidated
    oldLiqContract.isUnderWater().assertFalse() // new contract not under water
    // todo assert contract byte code is good

    // state
    this.liqContract.set(newLiqContractPubKey);
    this.usdMinted.set(newLiqContract.liquidationPrice.get().div(oldLiqContract.liquidationPrice.get()).mul(depositUsd));
    this.lastUpdate.set(Mina.getNetworkState().timestamp.value);
  }
  @method liquidateAndReset(depositUsd: Field) { 
    // asserts
    this.usdMinted.assertEquals(depositUsd);

    // todo send MINA to liquidator
    this.usdMinted.set(Field(0));
    this.minaDeposited.set(Field(0));
    this.lastUpdate.set(Mina.getNetworkState().timestamp.value);
  }
}

// OLD
/*
class liquidationEvent extends CircuitValue {
  @arrayProp(Field, 2) value: Field[];

  constructor(value: number[]) {
    super();
    this.value = value.map((value) => Field(value));
  }
}
*/