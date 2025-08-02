import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { createPublicClient, http, getContract, type PublicClient } from 'viem';
import { base } from 'viem/chains';
import blockchainConfig from '../../config/blockchain.config';
import { UniswapV4ABI, StateViewABI } from './constants/abis';
import { GetContractEventsParams } from './interfaces/get-contract-events.params.interface';
import { PinoLogger } from 'nestjs-pino';

/**
 * 🔗 BLOCKCHAIN SERVICE
 * 
 * Core service that provides low-level blockchain interaction capabilities.
 * This service acts as the foundation for all blockchain operations in the application.
 * 
 * 🎯 MAIN RESPONSIBILITIES:
 * - Initialize and manage blockchain client connections
 * - Provide access to Uniswap V4 contracts (PoolManager & StateView)
 * - Fetch blockchain data (blocks, events, contract states)
 * - Abstract blockchain complexity from higher-level services
 * 
 * 🏗️ ARCHITECTURE:
 * - Uses Viem library for type-safe blockchain interactions
 * - Connects to Base network (Coinbase's L2)
 * - Manages two main contracts: PoolManager (events) & StateView (state queries)
 * 
 * 📊 DATA FLOW:
 * TokenScannerService → BlockchainService → Base Network → Uniswap V4 Contracts
 */
@Injectable()
export class BlockchainService {
  // 🌐 Viem public client for reading blockchain data
  private readonly publicClient: PublicClient;
  
  // 📋 Contract instance for querying pool states (liquidity, prices, etc.)
  private readonly stateView: any;

  constructor(
    // 🔧 Inject blockchain configuration (RPC URLs, contract addresses, etc.)
    @Inject(blockchainConfig.KEY)
    private readonly config: ConfigType<typeof blockchainConfig>,
    
    // 📝 Logger for tracking blockchain operations
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BlockchainService.name);
    
    // 🌐 Initialize blockchain client connection to Base network
    // This client will be used for all read operations (events, blocks, contract calls)
    try {
      // Create transport first
      const transport = http(this.config.rpcUrl);
      
      // Create client without type checking
      // Using ts-ignore to bypass TypeScript compiler errors with viem
      // @ts-ignore
      this.publicClient = createPublicClient({
        chain: base, // Base network (Coinbase's L2)
        transport, // HTTP transport with configured RPC URL
      });
    } catch (error) {
      this.logger.error('Failed to create public client', error);
      throw error;
    }

    // 📋 Initialize StateView contract for querying pool states
    // StateView provides efficient batch queries for pool data
    // Trick TypeScript by using 'as any' to bypass strict type checking
    this.stateView = getContract({
      abi: StateViewABI, // Contract ABI for type-safe interactions
      address: this.config.contracts.stateView as `0x${string}`, // StateView contract address
      client: this.publicClient as any, // Bypass type checking
    });

    this.logger.debug('Blockchain service initialized');
  }

  /**
   * 🌐 GET PUBLIC CLIENT
   * 
   * Returns the Viem public client for direct blockchain interactions.
   * Used by other services that need to make custom blockchain calls.
   * 
   * @returns PublicClient - Viem client instance
   */
  getPublicClient() {
    return this.publicClient;
  }

  /**
   * 📋 GET STATE VIEW CONTRACT
   * 
   * Returns the StateView contract instance for querying pool states.
   * StateView provides efficient methods to get pool liquidity, prices, and ticks.
   * 
   * @returns Contract instance for StateView
   */
  getStateView() {
    return this.stateView;
  }

  /**
   * 📡 GET CONTRACT EVENTS
   * 
   * Fetches Uniswap V4 pool initialization events from the blockchain.
   * These events contain information about newly created pools.
   * 
   * 🔍 WHAT IT DOES:
   * - Queries PoolManager contract for 'Initialize' events
   * - Filters events within specified block range
   * - Returns pool creation data (currencies, fees, hooks, etc.)
   * 
   * @param params - Block range parameters
   * @returns Array of pool initialization events
   */
  async getContractEvents(params: GetContractEventsParams) {
    const { fromBlock, toBlock } = params;
    
    return this.publicClient.getContractEvents({
      abi: UniswapV4ABI, // Uniswap V4 PoolManager ABI
      address: this.config.contracts.poolManager as `0x${string}`, // PoolManager contract
      fromBlock, // Start block for event search
      toBlock, // End block for event search
      eventName: 'Initialize', // Specific event we're interested in
    });
  }

  /**
   * 🧱 GET BLOCK DATA
   * 
   * Fetches detailed information about a specific block.
   * Used primarily to get block timestamps for token metadata.
   * 
   * @param blockNumber - Block number to fetch
   * @returns Block data including timestamp, hash, etc.
   */
  async getBlock(blockNumber: bigint) {
    return this.publicClient.getBlock({ blockNumber });
  }

  /**
   * 🔢 GET LATEST BLOCK NUMBER
   * 
   * Gets the current latest block number from the blockchain.
   * Used to determine scanning ranges and ensure we're up to date.
   * 
   * @returns Latest block number as bigint
   */
  async getBlockNumber() {
    return this.publicClient.getBlockNumber();
  }
}