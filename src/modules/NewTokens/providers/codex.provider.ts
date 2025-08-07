import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Codex } from "@codex-data/sdk";
import { createClient } from "graphql-ws";
import { EventBusService } from '../../infrastructure/events/bus/event-bus.service';
import { 
  TokenInfo, 
  Launchpad, 
  Token, 
  TokenCreatedData, 
  SubscriptionResponse,
  NewTokenCreatedEvent
} from './interfaces';

@Injectable()
export class CodexProvider {
  private readonly codex: Codex;
  private readonly client: ReturnType<typeof createClient>;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventBus: EventBusService,
  ) {
    const apiKey = this.configService.get('codex.apiKey');
    const baseUrl = this.configService.get('codex.baseUrl');
    this.codex = new Codex(apiKey);
    
    this.client = createClient({
      url: baseUrl,
      connectionParams: {
        Authorization: apiKey,
      },
    });
  }

  subscribeToNewTokens() {
    return this.client.subscribe(
      {
        query: `
          subscription {
            onTokenCreated {
              token {
                name
                symbol
                address
                networkId
                createdAt
                info {
                  imageLargeUrl
                }
                launchpad {
                  graduationPercent
                  launchpadProtocol
                }
              }
              priceUSD
              marketCap
              volume24
              holders
            }
          }
        `,
      },
      {
        next: (data: SubscriptionResponse) => {
          const token = data.data?.onTokenCreated;
          if (!token) return;

          // Filter for TBA tokens (Base network - networkId 8453)
          const isTbaToken = token.token.networkId === 8453 && 
                           token.token.launchpad?.launchpadProtocol === 'Baseapp';

          // Filter for Zora tokens (Zora network - networkId 324)
          const isZoraToken = token.token.networkId === 324 && 
                            (token.token.launchpad?.launchpadProtocol === 'ZoraV4' || 
                             token.token.launchpad?.launchpadProtocol === 'ZoraCreatorV4');

          if (isTbaToken) {
            // Emit event for TBA token
            const tbaEvent: NewTokenCreatedEvent = {
              eventName: 'new-token-created',
              aggregateId: token.token.address,
              name: token.token.name,
              symbol: token.token.symbol,
              address: token.token.address,
              network: 'Base',
              protocol: 'TBA',
              networkId: token.token.networkId,
              createdAt: token.token.createdAt,
              priceUSD: token.priceUSD,
              marketCap: token.marketCap,
              volume24: token.volume24,
              holders: token.holders,
              imageLargeUrl: token.token.info?.imageLargeUrl,
              graduationPercent: token.token.launchpad?.graduationPercent,
              launchpadProtocol: token.token.launchpad?.launchpadProtocol,
              timestamp: new Date().toISOString(),
            };
            
            this.eventBus.publish(tbaEvent);

            console.log('New TBA token created on Base:', {
              name: token.token.name,
              symbol: token.token.symbol,
              address: token.token.address,
              network: 'Base',
              protocol: 'TBA',
              createdAt: token.token.createdAt,
              priceUSD: token.priceUSD,
              marketCap: token.marketCap,
              volume24: token.volume24,
              holders: token.holders
            });
          }

          if (isZoraToken) {
            // Emit event for Zora token
            const zoraEvent: NewTokenCreatedEvent = {
              eventName: 'new-token-created',
              aggregateId: token.token.address,
              name: token.token.name,
              symbol: token.token.symbol,
              address: token.token.address,
              network: 'Zora V4',
              protocol: token.token.launchpad?.launchpadProtocol || 'Unknown',
              networkId: token.token.networkId,
              createdAt: token.token.createdAt,
              priceUSD: token.priceUSD,
              marketCap: token.marketCap,
              volume24: token.volume24,
              holders: token.holders,
              imageLargeUrl: token.token.info?.imageLargeUrl,
              graduationPercent: token.token.launchpad?.graduationPercent,
              launchpadProtocol: token.token.launchpad?.launchpadProtocol,
              timestamp: new Date().toISOString(),
            };
            
            this.eventBus.publish(zoraEvent);

            console.log('New Zora token created:', {
              name: token.token.name,
              symbol: token.token.symbol,
              address: token.token.address,
              network: 'Zora V4',
              protocol: token.token.launchpad?.launchpadProtocol,
              createdAt: token.token.createdAt,
              priceUSD: token.priceUSD,
              marketCap: token.marketCap,
              volume24: token.volume24,
              holders: token.holders
            });
          }
        },
        error: (error) => {
          console.error('Error in new tokens subscription:', error);
        },
        complete: () => {
          console.log("New tokens subscription completed");
        },
      }
    );
  }
}
