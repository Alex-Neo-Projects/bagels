![codename bagel](https://github.com/Alex-Neo-Projects/bagels/blob/main/assets/banner.png)

# bagels 🥯 (alpha)

Bagels is a rapid prototyping tool for Solidity. 

Features:
- Interact with your contracts via the UI 
- Instantly see contract changes via the UI
- Also, this works with your existing testing framework! (Use it w/ hardhat or forge)

**The goal of bagels is to make iterating on smart contracts feel like a videogame.**

## Installation setup:
Pick your preferred node package manager:
```
npm i -g bagels 
```
or 
```
yarn add global bagels 
```
or 
```
bun -g i bagels
```

## Running bagels: 
Type `bagels` in your solidity project's root directory

#### Known limitations
1) **bagels is not a unit testing framework**. Bagels is about making the initial process of writing contracts faster and more fun by tightening the feedback loop.
2) **If you're going to deploy to mainnet, using a local network is probably not enough** and you should still test on a public testnet.
3) **We haven't tested this out with all possible combinations of ABIs**, so if you run into problems please raise an issue.
4) **Bagels doesn't (YET) work with contracts requiring different versions of solidity than the one you have installed locally**
   - to check your solc version, do `solcjs --version` in the command line.


##### Things to look out for: 
1) If the Anvil process fails to close, try running these commands: 
   1) `lsof -i:8545`
   2) Find the pid of the process
   3) `kill <pid>`
2) The following steps above can be applied for the backend and frontend process. Just replace the 8545 port number with the one that's failing to close.
   1) backed port: 9090 
   2) frontend port: 9091

#### Contributing to Bagels: 
1) Setup (we use bun):
   - `git clone https://github.com/Alex-Neo-Projects/bagels`
   - `cd bagels`
   - `bun i`
   - `bun run dev`
2) Make an issue telling us what you'd like to add
3) Make a PR
