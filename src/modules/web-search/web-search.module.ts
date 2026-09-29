import { Module } from '@nestjs/common';
import { WebSearchController } from './web-search.controller.js';
import { WebSearchService } from './web-search.service.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';

@Module({
  imports: [SubscriptionsModule],
  controllers: [WebSearchController],
  providers: [WebSearchService],
  exports: [WebSearchService],
})
export class WebSearchModule {}
