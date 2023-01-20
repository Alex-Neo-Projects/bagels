![codename bagel](https://github.com/Alex-Neo-Projects/bagels/blob/main/assets/banner.png)

## codename bagel 🥯

Bagel is a rapid prototyping tool for Solidity. 

With Bagel you can:
- Deploy your contracts on a local network instantly
- Interact with your contracts via the UI 
- Instantly see contract changes via the UI

**The goal of bagel is to make going from idea ➡️ prototype with smart contracts just as fast, convenient, and fun as making a website**

#### Installation setup:
```
npm i -g bagels 
or 
yarn add global bagels 
or 
bun -g i bagels
```

#### Running bagels: 
1) `cd` into your contracts folder 
2) run `bagels`

##### Coming soon:
- Fund your wallet/contract with various ERC20 tokens starting with USDC (WIP)
- Fork testnets/mainnet

### Known limitations
1) **bagel is not a replacement for unit tests**, it's just meant to just make the initial process of writing contracts faster and more fun
2) If you're going to deploy to mainnet, you should probably still test on a public testnet first
3) We haven't tested this out with all possible combinations of ABIs, so if you run into a bug please raise an issue.
4) bagel imports only work with local contracts. We will add support for other types of imported contracts (eg. Open Zeppelin).
5) bagel currently only works if you `cd` into the folder where you contracts are  stored.
#### Running this repo: 
(we use bun)

1) `Clone this repo`
2) `cd bagels`
3) `bun i`
4) `bun run dev`
<<<<<<< HEAD
=======

#### Things to look out for: 
1) If the Anvil process fails to close, try running these commands: 
   1) `lsof -i:8545`
   2) Find the pid of the process
   3) `kill <pid>`
2) The following steps above can be applied for the backend and frontend process. Just replace the 8545 port number with the one that's failing to close.
   1) backed port: 9090 
   2) frontend port: 9091
>>>>>>> main
