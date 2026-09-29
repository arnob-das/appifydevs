import { Module } from '@nestjs/common';
import { AiProvidersController } from './ai-providers.controller.js';
import { AiProvidersService } from './ai-providers.service.js';
import { ProviderAdapterFactory } from './adapters/provider-adapter.factory.js';

@Module({
  controllers: [AiProvidersController],
  providers: [AiProvidersService, ProviderAdapterFactory],
  exports: [AiProvidersService, ProviderAdapterFactory],
})
export class AiProvidersModule {}
