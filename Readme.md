![codename bagel](https://github.com/Alex-Neo-Projects/bagels/blob/main/assets/banner.png)

## codename bagel 🥯

Bagel is a rapid prototyping tool for Solidity. 

With Bagel you can:
- Deploy your contracts on a local network instantly
- Interact with your contracts via the UI 
- Instantly see contract changes via the UI

The goal of bagel is to make going from **idea ➡️ prototype with smart contracts just as fast, convenient, and fun as making a website**

#### Installation setup:
1) `npm i -g bagels` or `yarn add global bagels` or `bun -g i bagels`

##### Coming soon:
- Fund your wallet/contract with various ERC20 tokens starting with USDC (WIP)

- Fork testnets/mainnet

### Known limitations
1) **bagel is not a replacement for unit tests**, it's just meant to just make the initial process of writing contracts faster and more fun
2) If you're going to deploy to mainnet, you should probably still test on a public testnet first
3) We haven't tested this out with all possible combinations of ABIs, so if you run into a bug please raise an issue.

#### Running this repo: 
(we use bun)

1) `Clone this repo`
2) `cd bagels`
3) `bun i`
4) `bun run dev`
