import {
  Field,
  SmartContract,
  Experimental,
  state,
  State,
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
 - 
LOW HANGING
 - (?) chain the LiquidationBin contracts together.. then pass the number of contracts away when switching contracts
*/


export class LiquidationBin extends SmartContract {
  @state(Field) liquidationPrice = State<Field>();
  @state(Field) liquidationTime = State<Field>();
  @state(Field) unLiquidationTime = State<Field>();
  @method init(liquidationPrice: Field) { this.liquidationPrice.set(liquidationPrice);                             }
  @method setLiquidated()               { this.liquidationTime.set(new Field(Mina.getNetworkState().timestamp));   }
  @method setUnliquidated()             { this.unLiquidationTime.set(new Field(Mina.getNetworkState().timestamp)); }  
  @method isUnderWater() : boolean      { return this.liquidationTime > this.unLiquidationTime;                    }  
}

export class UserCollateral extends SmartContract {
  @state(Field) liqContract = State<Field>();
  @state(Field) usdMinted = State<Field>();
  @state(Field) minaDeposited = State<Field>();
  @state(Field) lastUpdate = State<Field>();

  @method init(liqContract: Field) { this.liqContract.set(liqContract);                              }
  @method isLiquidated(): boolean { return this.liqContract.liquidationTime > this.lastUpdate && this.usdMinted != 0; }
  @method changeUsd(incomingMina: Field, outgoingUsd: Field) {
      // asserts
      incomingMina.div(this.liqContract.liquidationPrice).assertGt(outgoingUsd);
      this.isLiquidated().assertEquals(false);

      // state updates
      this.usdMinted.set(this.usdMinted.add(outgoingUsd));
      this.lastUpdate.set(Mina.getNetworkState().timestamp);
      // TODO, send back leftover MINAs
  }
  @method changeLiqContract(newLiqContract: Field, depositUsd: Field) { 
      // asserts
      this.usdMinted.assertEquals(depositUsd);     // must cover the whole thing
      this.isLiquidated().assertEquals(false);     // not liquidated
      this.liqContract.isUnderWater().assertEquals(false) // new contract not under water
      // todo assert contract byte code is good

      // vars
      const oldContract: Field = this.liqContract;

      // state
      this.liqContract.set(newLiqContract);
      this.usdMinted.set(newLiqContract.minaLiquidationPrice.div(oldContract.minaLiquidationPrice).mul(depositUsd));
      this.lastUpdate.set(Mina.getNetworkState().timestamp);
  }
  @method liquidateAndReset(depositUsd: Field) { 
      // asserts
      this.usdMinted.assertEquals(depositUsd);

      // todo send MINA to liquidator
      this.usdMinted.set(0);
      this.minaDeposited.set(0);
      this.lastUpdate.set(Mina.getNetworkState().timestamp);
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