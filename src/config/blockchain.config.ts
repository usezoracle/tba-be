import { registerAs } from '@nestjs/config';

export default registerAs('blockchain', () => ({
  rpcUrl: process.env.RPC_URL,
  startBlockNumber: BigInt(process.env.START_BLOCK_NUMBER || '32964917'),
  blockRange: parseInt(process.env.BLOCK_RANGE || '400', 10),
  scanIntervalSeconds: parseInt(process.env.SCAN_INTERVAL_SECONDS || '2', 10),
  
  // Uniswap V4 contract addresses
  contracts: {
    poolManager: '0x498581ff718922c3f8e6a244956af099b2652b2b',
    stateView: '0xa3c0c9b65bad0b08107aa264b0f3db444b867a71',
  },
  
  // Hook addresses for token classification
  hooks: {
    zoraCreatorCoin: '0xd61A675F8a0c67A73DC3B54FB7318B4D91409040',
    zoraV4Coin: '0x9ea932730A7787000042e34390B8E435dD839040',
  },
  
  // TBA pairing addresses
  tbaPairings: [
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    '0x4200000000000000000000000000000000000006', // WETH
  ],
}));