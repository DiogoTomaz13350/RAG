import { Result } from '../../shared/result';

export const EMBEDDING_SERVICE = Symbol('EMBEDDING_SERVICE');

export type EmbedSummary = {
  chunks: number;
};

export enum EmbedMarkdownError {
  FileNotFound,
  NoChunks,
  EmbeddingFailed,
}

export interface IEmbeddingService {
  embedMarkdownFile(
    filePath: string,
  ): Promise<Result<EmbedSummary, EmbedMarkdownError>>;
}
