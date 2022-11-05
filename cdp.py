import functools

# TODO
# add interest rate
# add collateral ratio
# move to MINA
# add price oracle


####################################################################################################
# OLD

# BUG. can't add up liquidated values so eaisily. need a loop
def liquidate_better(minaPrice):
    global S

    # variables
    time_high = get_time()
    _, __, time_low = functools.reduce(lambda x1, x2: x2 if x2[2] == S.lastUpdatedLiquidationTime else x1, S.liquidationEvents)
    liqUsd, liqMina = functools.reduce(lambda x1, x2: 
                                       (x1[0]+x2[1],x1[1]+x2[2]) 
                                       if is_liquidated_position(mina,usd,x2[2],x2[1],x2[3],time_low, time_high) 
                                       else x1, 
                                       [(0,0)]+S.collateralEvents)

    # state update
    S.liquidationEvents.append((minaPrice, time_high))
    S.lUsd += liqUsd
    S.lMina += liqMina
    S.usd -= liqUsd
    S.mina -= liqMina
    S.lastUpdatedLiquidationTime = time_high


####################################################################################################
# HELPERS

TIMESTAMP = 0
def get_time():
    global TIMESTAMP
    TIMESTAMP += 1
    return TIMESTAMP
def is_liquidated_position(lMina, lUsd, cMina, cUsd, t, time_low, time_high):
    if t > time_high: 
        return False
    if t < time_low:
        return False
    if cUsd == 0:
        return False
    if lUsd == 0:
        return False
    return lMina * cMina / cUsd > 1
def newer_lower_liq_ratio(liq2, liq1, colT):
    minaPriceCurrent = liq1[0]
    minaPriceNewest = liq2[0]
    timeNewest = liq2[1]
    if colT > timeNewest: # put this at top to work
        return False
    return minaPriceNewest < minaPriceCurrent
def log(user):
    global S
    usd, mina = user_collateral(user)
    print(f"User.mina={mina} User.usd={usd}..", f"\t\tGlobal.. mina={S.mina} usd={S.usd} lMina={S.lMina} lUsd={S.lUsd}")

####################################################################################################
# APP

class State:
    # Events
    collateralEvents = [(0,0,0,0)]   # PubKey, USD, MINA, TIMESTAMP
    liquidationEvents = [(10000000, 0)]  # MINA_PRICE, TIMESTAMP

    # State
    usd = 0
    mina = 0
    actionsHash = 0
    lUsd = 0
    lMina = 0
    lastUpdatedLiquidationTime = 0
S = State()

    
def collateralize(pub_key, mina):
    global S

    t = get_time()
    mina_, usd_ = user_collateral(pub_key)
    mina_ += mina

    # state update
    S.mina += mina
    S.collateralEvents.append((pub_key, usd_, mina_, t))

def borrow(pub_key, usd):
    global S

    t = get_time()
    mina_, usd_ = user_collateral(pub_key)
    usd_ += usd
    liqMina, _ = functools.reduce(lambda x1, x2: x2, S.liquidationEvents)

    # asserts
    # assert ratio(mina_, usd_) > ratio(liqMina,liqUsd), "ratio too low!"
    assert usd_ >= 0, "no negative dollars!"

    # state update
    S.usd += usd
    S.collateralEvents.append((pub_key, usd_, mina_, t))

def liquidate(minaPrice):
    global S

    # variables
    usd = 1
    time_high = get_time()

    # state update
    S.liquidationEvents.append((minaPrice, time_high))
    S.lastUpdatedLiquidationTime = time_high

def user_collateral(pub_key): # -> (usd, mina)
    key, colUsd, colMina, colT = functools.reduce(lambda x1, x2: x2 if x2[0] == pub_key else x1, S.collateralEvents)
    minaPrice, liqT = functools.reduce(lambda liq1, liq2: liq2 if newer_lower_liq_ratio(liq2,liq1,colT) else liq1, S.liquidationEvents)
    
    if colUsd == 0:
        return colMina, colUsd

    liquidated = False if minaPrice == 0  else minaPrice * colMina / colUsd < 1 and liqT > colT
    if liquidated:
        return 0, 0

    return colMina, colUsd

####################################################################################################
# TESTS

# test                          (coll, debt)
collateralize(10, 100);  assert ( 100,    0) == user_collateral(10); #assert S.mina==100 and S.usd==0 and S.lMina==0 and S.lUsd==0
liquidate(2);            assert ( 100,    0) == user_collateral(10); #assert S.mina==100 and S.usd==0 and S.lMina==0 and S.lUsd==0
borrow(10, 5000);        assert ( 100, 5000) == user_collateral(10); #assert S.mina==100 and S.usd==5000 and S.lMina==0 and S.lUsd==0
liquidate(4);            assert (   0,    0) == user_collateral(10); #assert S.mina==0 and S.usd==0 and S.lMina==100 and S.lUsd==5000
collateralize(10, 100);  assert ( 100,    0) == user_collateral(10); #assert S.mina==100 and S.usd==0 and S.lMina==100 and S.lUsd==5000
collateralize(10, -50);  assert (  50,    0) == user_collateral(10); #assert S.mina==50 and S.usd==0 and S.lMina==100 and S.lUsd==5000
liquidate(20);           assert (  50,    0) == user_collateral(10); #assert S.mina==50 and S.usd==0 and S.lMina==100 and S.lUsd==5000
borrow(10, 50);          assert (  50,   50) == user_collateral(10); #assert S.mina==100 and S.usd==5000 and S.lMina==0 and S.lUsd==0
liquidate(3);            assert (  50,   50) == user_collateral(10); #assert S.mina==50 and S.usd==0 and S.lMina==100 and S.lUsd==5000
liquidate(1);            assert (  50,   50) == user_collateral(10); #assert S.mina==50 and S.usd==0 and S.lMina==100 and S.lUsd==5000
liquidate(.9999);        assert (   0,    0) == user_collateral(10); #assert S.mina==50 and S.usd==0 and S.lMina==100 and S.lUsd==5000

log(10)
