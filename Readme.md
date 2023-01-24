![codename bagel](https://github.com/Alex-Neo-Projects/bagels/blob/main/assets/banner.png)

## bagels 🥯

Bagels is a rapid prototyping tool for Solidity. 

With Bagels you can:
- Deploy your contracts on a local network instantly
- Interact with your contracts via the UI 
- Instantly see contract changes via the UI
- Also, this works with your existing testing framework! (Use it w/ hardhat or forge)

**The goal of bagels is to make writing and playing with smart contracts feel like a videogame**

#### Installation setup:
```
npm i -g bagels 
or 
yarn add global bagels 
or 
bun -g i bagels
```

#### Running bagels: 
1) run `bagels` in your project root

##### Coming soon:
- Fund your wallet/contract with various ERC20 tokens starting with USDC (WIP)
- Fork testnets/mainnet

### Known limitations
1) **bagels is not a unit testing framework**, it's just meant to just make the initial process of writing contracts faster and more fun by tightening the feedback loop
2) If you're going to deploy to mainnet, using a local network is probably not enough and you should still test on a public testnet
3) We haven't tested this out with all possible combinations of ABIs, so if you run into problems please raise an issue.
5) bagels currently only works if you `cd` into the folder where you contracts are stored.

#### Running this repo: 
(we use bun)

1) `Clone this repo`
2) `cd bagels`
3) `bun i`
4) `bun run dev`

#### Things to look out for: 
1) If the Anvil process fails to close, try running these commands: 
   1) `lsof -i:8545`
   2) Find the pid of the process
   3) `kill <pid>`
2) The following steps above can be applied for the backend and frontend process. Just replace the 8545 port number with the one that's failing to close.
   1) backed port: 9090 
   2) frontend port: 9091
