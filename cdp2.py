import functools

####################################################################################################
# HELPERS

TIMESTAMP = 0
def get_time():
    global TIMESTAMP
    TIMESTAMP += 1
    return TIMESTAMP

def log(c):
    if isinstance(c, CollateralContract):
        print('collateral contract')
        print(f'> liqPrice={c.minaLiquidationPrice}')
        print(f'> liqTime={c.liquidationTime}')
        print(f'> unLiqTime={c.unLiquidationTime}')
    else:
        print('user contract')
        print(f'> liqPrice={c.col_contract.minaLiquidationPrice}')
        print(f'> usd={c.usd_minted}')
        print(f'> last_update={c.last_update}')
        print(f'> liquidated?={c.is_liquidated()}')
def fails(fn):
    bad = False
    try:
        fn()
        bad = True
    except:
        pass
    assert bad == False, "didn't fail!!"

####################################################################################################
# APP

class CollateralContract:
    def __init__(self, minaLiquidationPrice):
        self.minaLiquidationPrice = minaLiquidationPrice
        self.liquidationTime = 0
        self.unLiquidationTime = 0

    def set_liquidated(self):    
        self.liquidationTime = get_time()
    def set_unLiquidated(self):  
        self.unLiquidationTime = get_time()
    def is_blocked(self): return self.liquidationTime > self.unLiquidationTime

class UserContract:
    def __init__(self, col_contract):
        self.col_contract = col_contract
        self.usd_minted = 0
        self.mina_deposited = 0
        self.last_update = 0
    def is_liquidated(self):  return self.col_contract.liquidationTime > self.last_update and self.last_update != 0
    def change_usd(self, incoming_mina, outgoing_usd):
        assert incoming_mina / self.col_contract.minaLiquidationPrice > outgoing_usd, "not enough MINAs!!! 🤑🤑🤑🤑"
        assert not self.is_liquidated(), "liquidated!!"

        if not self.is_liquidated():
            self.usd_minted += outgoing_usd
            self.last_update = get_time()
        # TODO, send back leftover MINAs

    def change_contract(self, new_contract, incoming_deposit_usd_amount):
        # asserts
        assert self.usd_minted == incoming_deposit_usd_amount, "must cover the whole thing!"
        assert not self.is_liquidated(), "position is liquidated!"
        assert not new_contract.is_blocked(), "new contract is blocked (under water)!"

        # vars
        old_contract = self.col_contract

        # state
        self.col_contract = new_contract
        self.usd_minted = int(old_contract.minaLiquidationPrice / new_contract.minaLiquidationPrice * incoming_deposit_usd_amount) # int for testing
        self.last_update = get_time()
    def liquidate_and_reset(self):
        print('sending MINA to the liquidator. maybe change contract and liquidate the remainder?')
        self.usd_minted = 0
        self.mina_deposited = 0
        self.last_update = 0        

####################################################################################################
# EXAMPLE

# contracts
c_2 = CollateralContract(1 * 1.1 ** -2)
c_1 = CollateralContract(1 * 1.1 ** -1)
c0  = CollateralContract(1 * 1.1 **  0)
c1  = CollateralContract(1 * 1.1 **  1)
c2  = CollateralContract(1 * 1.1 **  2)
c3  = CollateralContract(1 * 1.1 **  3)
u1  = UserContract(c1)

print(f'->event, $/mina={1*1.1**-1}')
c_2.set_liquidated()
c_1.set_liquidated()
u1.change_usd(100, 43);                               assert u1.usd_minted == 43

print(f'->event, $/mina={1*1.1**1}')
c1.set_liquidated();                                  assert u1.usd_minted == 43 and u1.is_liquidated() == True
fails(lambda: u1.change_usd(1000, 0));                assert u1.usd_minted == 43 and u1.is_liquidated() == True
fails(lambda: u1.change_contract(c2, u1.usd_minted)); assert u1.usd_minted == 43 and u1.is_liquidated() == True

print(f'->event, $/mina={1*1.1**1}')
u1.liquidate_and_reset();                             assert u1.usd_minted == 0 and u1.is_liquidated() == False
u1.change_contract(c2, 0)
u1.change_usd(100, 63);                               assert u1.usd_minted == 63 and u1.is_liquidated() == False
u1.change_contract(c3, 63)

print(f'->event, $/mina={1*1.1**2}')
c2.set_liquidated();                                  assert u1.usd_minted == 57 and u1.is_liquidated() == False
