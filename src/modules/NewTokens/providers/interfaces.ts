import { Event } from '../../infrastructure/events/interfaces';

export interface TokenInfo {
  imageLargeUrl?: string;
}

export interface Launchpad {
  graduationPercent?: number;
  launchpadProtocol?: string;
}

export interface Token {
  name: string;
  symbol: string;
  address: string;
  networkId: number;
  createdAt: string;
  info?: TokenInfo;
  launchpad?: Launchpad;
}

export interface TokenCreatedData {
  token: Token;
  priceUSD?: number;
  marketCap?: number;
  volume24?: number;
  holders?: number;
}

export interface SubscriptionResponse {
  data?: {
    onTokenCreated?: TokenCreatedData;
  };
}

export interface NewTokenCreatedEvent extends Event {
  readonly name: string;
  readonly symbol: string;
  readonly address: string;
  readonly network: string;
  readonly protocol: string;
  readonly networkId: number;
  readonly createdAt: string;
  readonly priceUSD?: number;
  readonly marketCap?: number;
  readonly volume24?: number;
  readonly holders?: number;
  readonly imageLargeUrl?: string;
  readonly graduationPercent?: number;
  readonly launchpadProtocol?: string;
}
