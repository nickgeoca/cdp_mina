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
  // reducers
  collateralEvents = Experimental.Reducer({ actionType: Field });  // type= (PubKey, USD, MINA, TIMESTAMP)
  liquidationEvents = Experimental.Reducer({ actionType: Field }); // type= (MINA_PRICE, TIMESTAMP)

  // state
  @state(Field) collateralEventsActionHash = State<Field>();
  @state(Field) liquidationEventsActionHash = State<Field>();

  // fns
  @method init() {
    // for now append this as an initializer
    // collateralEvents = [(0,0,0,0)]   
    // liquidationEvents = [(10000000, 0)]  
   }

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

  
    // PYTHON
    // (PubKey, USD, MINA, TIMESTAMP)
    // fn = lambda x1, x2: x2 if x2[0] == pub_key else x1
    //  key, colUsd, colMina, colT = functools.reduce(fn, S.collateralEvents)
    /* TYPESCRIPT
    let { state: newCounter, actionsHash: newCollateralEventsActionHash } =
    this.collateralEvents.reduce(
      pendingCollateralEventsActions,
      Field,                                // state type
      (state: Field, _action: Field) => {   // function that says how to apply an action
        return state.add(1);
      },
      { state: REPLACEME, collateralEventsActionHash }
    );
    */
    let x = Field(1);
    return [x, x];

    /*
    // minaPrice, liqT = functools.reduce(lambda liq1, liq2: liq2 if newer_lower_liq_ratio(liq2,liq1,colT) else liq1, S.liquidationEvents)
    let { state: newCounter, actionsHash: newActionsHash } =
    this.collateralEvents.reduce(
      pendingCollateralEventsActions,
      Field,                                // state type
      (state: Field, _action: Field) => {   // function that says how to apply an action
        return state.add(1);
      },
      { state: REPLACEME, this.collateralEventsActionHash }
    );

    if (colUsd == 0) {
        return colMina, colUsd;
    }

    const liquidated: Bool = minaPrice == 0? false: minaPrice * colMina / colUsd < 1 and liqT > colT;
    if (liquidated) {
        return 0, 0;
    }

    return colMina, colUsd

*/
  }  
}