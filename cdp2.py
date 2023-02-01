import functools

####################################################################################################
# HELPERS

TIMESTAMP = 0
def get_time():
    global TIMESTAMP
    TIMESTAMP += 1
    return TIMESTAMP

def log(c):
    if isinstance(c, CDP_Contract):
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

class Monitors:
    def __init__(self):
        pass
    def monitor_cdps_left(liquidator):
        """how many cdps before liquidator runs out?"""
        cdps_left, cdps_right = 0
        # liquidator.cdp.

####################################################################################################
# APP
class AIGoverance_Contract:
    def __init__(self, param_contract):
        # Fixed
        self.protocol_param_contract = param_contract # SLOT 1

    def set_onchain_ai_computation():
        return


class ProtocolParameters_Contract:
    def __init__(self):
        # Fixed
        self.f = 1.02        # SLOT 1 # TODO HARD CODE?
        self.ai = None       # SLOT 2, AI Governance contract TODO HARD CODE?
        # Dynamic
        self.l = 1.5         # SLOT 3
        self.o = 60          # SLOT 4



    def set_dynamic_params(self, l, o):
        # assert AI only
        self.l = l
        self.o = o

class PriceOracle_Contract:
    def __init__(self, starting_cdp, param_contract):
        # Dynamic
        self.cdp = starting_cdp                # SLOT 1
        self.param_contract = param_contract   # SLOT 2
        self.price = 10000                     # SLOT 3
    
    def oracle_set_price(self, price):
        """set price then refund"""
        while self.cdp and price < self.cdp.r:
            self.cdp.set_liquidated()
            self.cdp = self.cdp.next_cdp
        while self.cdp and price > self.cdp.r:
            self.cdp.set_unLiquidated()
            self.cdp = self.cdp.prev_cdp            

    def donate_oracle(self, price):
        """send mina here as a bounty"""

class Liquidator_Contract:
    """liquidates via swap"""
    def __init__(self, param_contract):
        return
    def swap(dollars_to_burn, user_contracts):
        for u in user_contracts:
            u.change_contract()
        # TODO
        
class CDP_Contract:
    def __init__(self, params_contract, a, prev_cdp, next_cdp):
        # Fixed
        self.params = params_contract              # SLOT 1 TODO Hard code?
        self.a = a                     # SLOT 1
        self.priceOracle               # SLOT 2  # TODO HARD CODE?
        self.prev_cdp = prev_cdp           # SLOT 3
        self.next_cdp = next_cdp        # SLOT 4
        # Dynamic
        self.liquidationTime = 0    # SLOT 5
        self.unLiquidationTime = 0  # SLOT 6 TODO, REMOVE THIS ONE?
                                    # SLOT 7
        #                           # SLOT 8

    @property
    def r(self): return self.params.f ** self.a * self.params.l
    def set_liquidated(self):    
        self.liquidationTime = get_time()
    def set_unLiquidated(self):  
        self.unLiquidationTime = get_time()
    def is_blocked(self): 
        return self.liquidationTime > self.unLiquidationTime
    def set_next_cdp(self):
        self.next_cdp = self.next_cdp or CDP_Contract(self.params, self.a + 1, self, None)
        return self.next_cdp
    def set_prev_cdp(self):
        self.prev_cdp = self.prev_cdp or CDP_Contract(self.params, self.a - 1, None, self)
        return self.prev_cdp

class User_Contract:
    def __init__(self, cdp_contract):
        self.cdp_contract = cdp_contract # SLOT 1
        self.usd_minted = 0              # SLOT 2
        self.mina_deposited = 0          # SLOT 3
        self.last_update = get_time()    # SLOT 4
        # HARD CODE
        self.liquidator_contract

    def is_liquidated(self):  
        return self.cdp_contract.liquidationTime > self.last_update and self.usd_minted != 0
    def change_usd(self, incoming_mina, outgoing_usd):
        assert incoming_mina / self.cdp_contract.r > outgoing_usd, "not enough MINAs!!! 🤑🤑🤑🤑"
        assert not self.is_liquidated(), "liquidated!!"

        self.usd_minted += outgoing_usd
        self.last_update = get_time()
        # TODO, send back leftover MINAs

    def change_contract(self, new_contract, incoming_deposit_usd_amount):
        # asserts
        assert self.usd_minted == incoming_deposit_usd_amount, "must cover the whole thing!"
        assert not self.is_liquidated(), "position is liquidated!"
        assert not new_contract.is_blocked(), "new contract is blocked (under water)!"

        # vars
        old_contract = self.cdp_contract

        # state
        self.cdp_contract = new_contract
        self.usd_minted = int(new_contract.r / old_contract.r * incoming_deposit_usd_amount) # int for testing
        self.last_update = get_time()
    def liquidate_and_reset(self, usd_deposited):
        print('sending MINA to the liquidator. maybe change contract and liquidate the remainder?')
        self.usd_minted = 0
        self.mina_deposited = 0
        self.last_update = get_time()        

####################################################################################################
# EXAMPLE

params = ProtocolParameters_Contract()
cdp0 = CDP_Contract(params, 0)
PriceOracle_Contract(cdp0, params)
cdp1 = cdp0.next_cdp()
cdp2 = cdp1.next_cdp()
cdp3 = cdp2.next_cdp()
cdp_1 = cdp0.prev_cdp()
cdp_2 = cdp_1.prev_cdp()
cdp_3 = cdp_2.prev_cdp()


# contracts
c_3 = CDP_Contract(1 * 1.1 ** -3)
c_2 = CDP_Contract(1 * 1.1 ** -2)
c_1 = CDP_Contract(1 * 1.1 ** -1)
c0  = CDP_Contract(1 * 1.1 **  0)
c1  = CDP_Contract(1 * 1.1 **  1)
c2  = CDP_Contract(1 * 1.1 **  2)
c3  = CDP_Contract(1 * 1.1 **  3)

u1  = User_Contract(c1)
# tests
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
