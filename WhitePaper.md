## Equations

$p=\text{mina price in USD}$
$l=\text{liquidation ratio}$
$u=\text{user}$
$a=\text{contract number} ,  a \in [-150,700]$
$f=\text{factor}$
$c=\text{lent in MINA}$
$d=\text{debt in USD}$
$w=\text{withdraw ratio. USD minted to 1 MINA}$
$r=\text{contract liquidation price}$
$t=\text{time}$
$o=\text{oracle price delay}$

#### Core Protocol
$w_a= f^{a}$
$r_a= l*w_a$
$d_u= c_{u}*w_a$
$d=\sum{c_a*w_a}$

#### Liquidation Protocol
time delay
roll over


#### Price oracle Protocol
$r(a)= p < l*w_a$

#### Protocol Parameters
$l, f, o$
$\text{as l goes to infinity then use}l=1\text{then }$

## Contracts
1. CDPa. Variables
 a. liquidation Time, no reducer
2. CDPu = 