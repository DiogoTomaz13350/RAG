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

      For every user question, call the "findPossibleAnswers" tool first, passing the user's question as the tool input.
      Answer using only the possible answers returned by the tool; never invent information.
      If the tool returns no relevant answers, say so without making assumptions.
    `,

    model: { id: 'google/gemini-3.5-flash', apiKey },

    tools: {
      findPossibleAnswers: FindPossibleAnswersToolFactory(db, embeddingModel),
    },
  });
}
