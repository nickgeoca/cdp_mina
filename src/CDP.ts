import {
  Field,
  SmartContract,
  Experimental,
  state,
  State,
  method,
  DeployArgs,
  Permissions,
} from 'snarkyjs';

export class CDP extends SmartContract {
  collateralEvents = Experimental.Reducer({ actionType: Field });
  liquidationEvents = Experimental.Reducer({ actionType: Field });
  @state(Field) collateralEventsActionHash = State<Field>();
  @state(Field) liquidationEventsActionHash = State<Field>();


  @method init() { }
  @method collateralize(pubKey: Field, mina: Field) { }
  @method borrow(pubKey: Field, usd: Field) { }
  @method liquidate(minaPrice: Field) { }
  @method user_collateral(pubKey: Field) : [Field, Field] {
    // get previous counter & actions hash, assert that they're the same as on-chain values
    let collateralEventsActionHash = this.collateralEventsActionHash.get();
    this.collateralEventsActionHash.assertEquals(collateralEventsActionHash);
    let liquidationEventsActionHash = this.liquidationEventsActionHash.get();
    this.liquidationEventsActionHash.assertEquals(liquidationEventsActionHash);
    
    // compute new actions??
    let pendingCollateralEventsActions = this.collateralEvents.getActions({
      fromActionHash: collateralEventsActionHash,
    });
    let pendingLiquidationEventsActions = this.liquidationEvents.getActions({
      fromActionHash: liquidationEventsActionHash,
    });

    let x = Field(1);
    return [x, x];
  }  
}