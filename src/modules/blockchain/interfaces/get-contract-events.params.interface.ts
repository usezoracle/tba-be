/**
 * Parameters for getting contract events from blockchain
 */
export interface GetContractEventsParams {
  fromBlock: bigint;
  toBlock: bigint;
}