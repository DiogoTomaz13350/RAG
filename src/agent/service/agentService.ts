import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Mastra } from '@mastra/core';
import { DB_SERVICE } from '../../database/services/dbServiceInterface';
import type { IDbService } from '../../database/services/dbServiceInterface';
import { EMBEDDING_MODEL } from '../../embedding/services/geminiEmbeddingModelInterfaceService';
import type { IEmbeddingModel } from '../../embedding/services/geminiEmbeddingModelInterfaceService';
import { err, okey, Result } from '../../shared/result';
import { MastraFactory } from '../mastra/mastraFactory';
import { IAgentService, RagAgentError } from './agentServiceInterface';

@Injectable()
export class AgentService implements IAgentService {
  private readonly mastra: Mastra;

  constructor(
    @Inject(DB_SERVICE) db: IDbService,
    @Inject(EMBEDDING_MODEL) embeddingModel: IEmbeddingModel,
    config: ConfigService,
  ) {
    this.mastra = MastraFactory(
      db,
      embeddingModel,
      config.getOrThrow<string>('GEMINI_API_KEY'),
    );
  }

  async askRAGagent(prompt: string): Promise<Result<string, RagAgentError>> {
    const response = await this.mastra
      .getAgent('assistantAgent')
      .generate(prompt);
    if (!response.text) {
      return err(RagAgentError.EmptyResponse);
    }

    return okey(response.text);
  }
}
