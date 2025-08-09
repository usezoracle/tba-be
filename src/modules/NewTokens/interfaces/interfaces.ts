export type LaunchpadToken = {
  name?: string;
  symbol?: string;
  address: string;
  networkId: number;
  createdAt?: string;
  info?: { imageLargeUrl?: string };
  launchpad?: { graduationPercent?: number; launchpadProtocol?: string };
};

export type LaunchpadBatchItem = {
  eventType?: string;
  token?: LaunchpadToken;
  priceUSD?: number; // matches GraphQL alias in selection
  marketCap?: number;
  volume24?: number;
  holders?: number;
  timestamp?: string;
};
