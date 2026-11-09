import { Result } from 'src/shared/result';

export const EMBEDDING_MODEL = Symbol('EMBEDDING_MODEL');

export enum EmbeddingTaskType {
  Document = 'RETRIEVAL_DOCUMENT',
  Query = 'RETRIEVAL_QUERY',
}

export interface IEmbeddingModel {
  embed(
    text: string,
    taskType: EmbeddingTaskType,
  ): Promise<Result<number[], EmbeddingModelError>>;
}

export enum EmbeddingModelError {
  FailedToEmbed,
}
