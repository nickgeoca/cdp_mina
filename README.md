# Mina zkApp: Cdp

> Proof of concept CDP on MINA Protocol. Collateralize MINA to mint dollars (USD). Uses liquidation binning so that under collaterlized funds are locked in one transaction.

Proof of concept. Run `python cdp.py` to get gist of it. Ideally design this without a price orcale, because it's a point of failure.

## How to build
```sh
npm run build
```
## How to run tests
```sh
python cdp.py
npm run test
npm run testw # watch mode
```
## How to run coverage
```sh
npm run coverage
```
