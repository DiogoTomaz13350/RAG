import { Result } from 'src/shared/result';

export const EMBEDDING_MODEL = Symbol('EMBEDDING_MODEL');

export interface IEmbeddingModel {
  embed(text: string): Promise<Result<number[], EmbeddingModelError>>;
}

export enum EmbeddingModelError {
  FailedToEmbed,
}
