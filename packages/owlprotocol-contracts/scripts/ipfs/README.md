1. Create a .env file. Copy all the values from .env.test into the newly created .env file in the packages/owlprotocol-contracts/ directory
2. Run `npm run hardhat:node`
   RPC url for this chain will be 'http://127.0.0.1:8545/'
3. Run `npm run ipfs`
4. Run `npm run ipfs:configure`
5. Run `npm run ipfs` again to restart the node after configuration
6. Run `node scripts/ipfs/ipfsDeploy.js` to upload metadata to local IPFS node.
   CID should be printed in console. It will say `Cid is ${CID}`. It should be 'QmPEQ3BBNxWWRtJPaLCqDQq6HWNtKieZsJ9qutw2FcE4b8'
7. Run `npm run deploy:ERC721` to deploy NFT on local testnet
   Contract address should be printed in console. It will say `ERC721 beacon proxy deployed to ${CONRACT_ADDRESS} with 450481 gas`. It should be '0x54D62588Cb1239FCFAEB8575aD93896099E6B739'
