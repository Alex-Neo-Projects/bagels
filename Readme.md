
# bagels 🥯 (alpha)

**Bagels is a rapid prototyping tool for Solidity.**

We made Bagels you can see smart contract edits instantly. Instead of writing tests, scripts, frontends, or deploying on a testnet for every change, just use bagels!

https://user-images.githubusercontent.com/7016669/215215794-ad117c14-a251-4d60-a3a7-c6d6467fa428.mp4

(excuse the video's low quality, it was hard to get it under the 10mb Github limit!)

## Installation setup:

Install bagels: 
``` 
npm i -g bagels 
```

## Running bagels: 
1) `cd` into your project's root directory
2) Type: `bagels`


## Community & support: 

Join our [discord](https://discord.gg/DC77fxj3ks)!

#### Known limitations
1) **Bagels is in alpha. Many things will not work. When you run into bugs, please raise an issue here or in our [discord](https://discord.gg/DC77fxj3ks)**
   - We haven't tested this out with all possible combinations of ABIs, and a lot of things are lacking atm. 
2) **Bagels is not a replacement for unit testing frameworks**
   - Bagels is about making the initial process of writing contracts faster and more fun by tightening the feedback loop.
3) **Bagels doesn't (YET) work with contracts requiring different versions of solidity than the one you have installed locally**
   - to check your solc version, do `solcjs --version` in the command line.
4) **Bagels only works on mac right now**

## Acknowledgements

- Shoutout to [foundry](https://github.com/foundry-rs/foundry), because we use Anvil in this project for the local network :)