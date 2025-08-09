import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, Client } from 'graphql-ws';
import WebSocket from 'ws';
import { EventBusService } from '../../infrastructure/events/bus/event-bus.service';
import { PinoLogger } from 'nestjs-pino';
import { NewTokenCreatedEvent } from './interfaces';
import { LaunchpadBatchItem } from '../interfaces/interfaces';

@Injectable()
export class CodexProvider implements OnModuleInit, OnModuleDestroy {
  private client: Client | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventBus: EventBusService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CodexProvider.name);
  }

  async onModuleInit() {
    // this.logger.info('Starting Codex subscription');
    // this.startSubscription();
  }

  onModuleDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private startSubscription(): void {
    const apiKey = this.configService.get<string>('codex.apiKey');
    const url = this.configService.get<string>('codex.baseUrl') as string;

    this.client = createClient({
      url,
      webSocketImpl: WebSocket,
      connectionParams: { Authorization: apiKey },
      on: {
        connected: () => this.logger.info('Codex WS connected'),
        closed: (e) => this.logger.warn('Codex WS closed', { code: (e as CloseEvent).code }),
      },
    });

    const variables = {
      input: {
        protocols: ['Baseapp', 'ZoraV4', 'ZoraCreatorV4'],
        networkIds: [8453, 324],
        eventTypes: ['Created', 'Migrated'],
      },
    };

    const dispose = this.client.subscribe(
      {
        query: `
          subscription ($input: OnLaunchpadTokenEventBatchInput!) {
            onLaunchpadTokenEventBatch(input: $input) {
              eventType
              token {
                name
                symbol
                address
                networkId
                createdAt
                info { imageLargeUrl }
                launchpad { graduationPercent launchpadProtocol }
              }
              priceUSD: priceUsd
              marketCap
              volume24
              holders
              timestamp
            }
          }
        `,
        variables,
      },
      {
        next: (payload: { data?: { onLaunchpadTokenEventBatch?: LaunchpadBatchItem[] } }) => {
          const items = payload?.data?.onLaunchpadTokenEventBatch || [];
          for (const item of items) {
            const token = item.token;
            if (!token?.address || typeof token.networkId !== 'number') continue;

            const protocol = token.launchpad?.launchpadProtocol;
            const networkId = token.networkId;

            const isTbaBase = networkId === 8453 && protocol === 'Baseapp';
            const isZora = networkId === 324 && (protocol === 'ZoraV4' || protocol === 'ZoraCreatorV4');
            if (!isTbaBase && !isZora) continue;

            const event: NewTokenCreatedEvent = {
              eventName: 'new-token-created',
              aggregateId: token.address,
              name: token.name ?? 'Unknown',
              symbol: token.symbol ?? 'Unknown',
              address: token.address,
              network: isTbaBase ? 'Base' : 'Zora V4',
              protocol: isTbaBase ? 'TBA' : protocol || 'Unknown',
              networkId,
              createdAt: token.createdAt || new Date().toISOString(),
              priceUSD: item.priceUSD,
              marketCap: item.marketCap,
              volume24: item.volume24,
              holders: item.holders ?? 0,
              imageLargeUrl: token.info?.imageLargeUrl,
              graduationPercent: token.launchpad?.graduationPercent ?? 0,
              launchpadProtocol: protocol,
              timestamp: item.timestamp || new Date().toISOString(),
            };

            this.eventBus.publish(event);
          }
        },
        error: (error: unknown) => {
          this.logger.error('Codex subscription error', { error: String(error) });
        },
        complete: () => this.logger.warn('Codex subscription completed'),
      },
    );

    this.unsubscribe = () => dispose();
    this.logger.info('Codex subscription initialized');
  }
}
