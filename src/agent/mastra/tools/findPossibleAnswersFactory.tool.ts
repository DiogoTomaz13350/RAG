import { createTool } from '@mastra/core/tools';
import { IDbService } from 'src/database/services/dbServiceInterface';
import { IEmbeddingModel } from 'src/embedding/services/geminiEmbeddingModelInterfaceService';
import { z } from 'zod';

export const FindPossibleAnswersToolFactory = (
  db: IDbService,
  model: IEmbeddingModel,
) => {
  return createTool({
    id: 'find-possible-answer',

    description: 'Find a set of possible answers to a given question',

    inputSchema: z.object({
      question: z.string(),
    }),
    outputSchema: z.array(z.string() || z.null()).optional(),

    execute: async ({ question }) => {
      const embedding = await model.embed(question);
      if (!embedding.IsSuccess) {
        return [];
      }

      const matches = await db.findClosestFive(embedding.value);
      if (!matches.IsSuccess) {
        return [];
      }

      return matches.value.map((answer) => answer.content);
    },
  });
};
