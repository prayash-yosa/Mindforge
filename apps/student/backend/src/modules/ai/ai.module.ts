/**
 * Mindforge Backend — AI Module (Task 4.1)
 *
 * Provides AI provider service and prompt builder.
 * Global module — available to all feature modules.
 */

import { Global, Module } from '@nestjs/common';
import { AiProviderService } from './ai-provider.service';
import { PromptBuilderService } from './prompt-builder.service';

@Global()
@Module({
  providers: [AiProviderService, PromptBuilderService],
  exports: [AiProviderService, PromptBuilderService],
})
export class AiModule {}
