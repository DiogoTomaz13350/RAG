import { Agent } from '@mastra/core/agent';
import type { IDbService } from 'src/database/services/dbServiceInterface';
import type { IEmbeddingModel } from 'src/embedding/services/geminiEmbeddingModelInterfaceService';
import { FindPossibleAnswersToolFactory } from '../tools/findPossibleAnswersFactory.tool';

export function AssistantAgentFactory(
  db: IDbService,
  embeddingModel: IEmbeddingModel,
  apiKey: string,
) {
  return new Agent({
    id: 'assistant-agent',

    name: 'Assistant Agent',

    instructions: `
      You are a helpful assistant.

      You can find possible answers to questions using the available tool.
      Use the "findPossibleAnswers" tool to get relevant answers based on the question provided.
      Answer based on the possible answers retrieved from the tool, the question and never invent information.
      If no relevant answers are found, respond accordingly without making assumptions.
    `,

    model: { id: 'google/gemini-3.5-flash', apiKey },

    tools: {
      findPossibleAnswers: FindPossibleAnswersToolFactory(db, embeddingModel),
    },
  });
}
