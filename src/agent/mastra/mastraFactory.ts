import { Mastra } from '@mastra/core';
import type { IDbService } from '../../database/services/dbServiceInterface';
import type { IEmbeddingModel } from '../../embedding/services/geminiEmbeddingModelInterfaceService';
import { AssistantAgentFactory } from './agents/assistantAgentFactory.agent';

export function MastraFactory(
  db: IDbService,
  embeddingModel: IEmbeddingModel,
  apiKey: string,
): Mastra {
  return new Mastra({
    agents: {
      assistantAgent: AssistantAgentFactory(db, embeddingModel, apiKey),
    },
  });
}
