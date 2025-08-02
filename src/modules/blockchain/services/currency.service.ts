import { Injectable } from '@nestjs/common';
import { Ether, Token, type Currency } from '@uniswap/sdk-core';
import { erc20Abi, getContract, zeroAddress } from 'viem';
import { base } from 'viem/chains';
import { GetCurrencyParams } from '../interfaces/get-currency.params.interface';

/**
 * 🪙 CURRENCY SERVICE - TOKEN INFORMATION FETCHER
 * 
 * Specialized service for fetching detailed token/currency information from the blockchain.
 * Handles both native ETH and ERC-20 tokens with proper type safety.
 * 
 * 🎯 MAIN RESPONSIBILITIES:
 * - Fetch token metadata (name, symbol, decimals)
 * - Handle native ETH vs ERC-20 token distinction
 * - Create Uniswap SDK Currency objects
 * - Optimize blockchain calls with parallel execution
 * 
 * 🏗️ ARCHITECTURE:
 * - Uses Viem for type-safe contract interactions
 * - Leverages Uniswap SDK for currency abstraction
 * - Handles Base network specifics
 * - Parallel contract calls for efficiency
 * 
 * 💡 DESIGN DECISIONS:
 * - Zero address detection for native ETH
 * - Parallel fetching of token properties
 * - Standardized Currency interface
 * - Error handling for invalid tokens
 */
@Injectable()
export class CurrencyService {
  /**
   * 🪙 GET CURRENCY INFORMATION FROM BLOCKCHAIN
   * 
   * Fetches comprehensive token information and creates a Currency object.
   * Handles both native ETH (zero address) and ERC-20 tokens seamlessly.
   * 
   * 🔍 DETECTION LOGIC:
   * - Zero address (0x0000...0000) → Native ETH
   * - Any other address → ERC-20 token
   * 
   * 📊 FOR ERC-20 TOKENS, FETCHES:
   * - name(): Human-readable token name
   * - symbol(): Token ticker symbol
   * - decimals(): Number of decimal places
   * 
   * ⚡ OPTIMIZATION:
   * - Parallel contract calls for efficiency
   * - Single blockchain round-trip
   * 
   * @param params - Contains token address and blockchain client
   * @returns Currency object (either Ether or Token)
   */
  async getCurrency(params: GetCurrencyParams): Promise<Currency> {
    const { address, publicClient } = params;
    
    // 🔍 Handle native ETH (zero address)
    if (address === zeroAddress) {
      return Ether.onChain(base.id);
    }

    // 📊 Fetch ERC-20 token metadata in parallel for efficiency
    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        abi: erc20Abi,
        address: address as `0x${string}`,
        functionName: 'name',
      }),
      publicClient.readContract({
        abi: erc20Abi,
        address: address as `0x${string}`,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        abi: erc20Abi,
        address: address as `0x${string}`,
        functionName: 'decimals',
      }),
    ]);

    // 🏗️ Create Token instance with fetched metadata
    return new Token(base.id, address, decimals, symbol, name);
  }
}