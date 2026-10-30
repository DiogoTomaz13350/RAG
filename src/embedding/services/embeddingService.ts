import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { DB_SERVICE } from '../../database/services/dbServiceInterface';
import type { IDbService } from '../../database/services/dbServiceInterface';
import { err, okey, Result } from '../../shared/result';
import { EMBEDDING_MODEL } from './geminiEmbeddingModelInterfaceService';
import type { IEmbeddingModel } from './geminiEmbeddingModelInterfaceService';
import {
  EmbedSummary,
  IEmbeddingService,
  EmbeddingServiceError,
} from './embeddingServiceInterface';

@Injectable()
export class EmbeddingService implements IEmbeddingService {
  constructor(
    @Inject(DB_SERVICE) private readonly db: IDbService,
    @Inject(EMBEDDING_MODEL) private readonly model: IEmbeddingModel,
  ) {}

  async embedMarkdownFile(
    filePath: string,
  ): Promise<Result<EmbedSummary, EmbeddingServiceError>> {
    const text: string = await readFile(resolve(filePath), 'utf8');

    if (!text || text.trim().length === 0) {
      return err(EmbeddingServiceError.EmptyFile);
    }

    const chunks = this.splitSentences(text);
    if (chunks.length === 0) {
      return err(EmbeddingServiceError.NoChunks);
    }

    for (const chunk of chunks) {
      const embedding = await this.model.embed(chunk);
      if (!embedding.IsSuccess) {
        return err(EmbeddingServiceError.EmbeddingFailed);
      }
      await this.db.insertEmbedding(chunk, embedding.value);
    }
    return okey({ chunks: chunks.length });
  }

  private splitSentences(text: string): string[] {
    const sentences = text
      .split(/\.(?=\s|$)/)
      .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
      .filter((sentence) => sentence.length > 0);
    return [...new Set(sentences)];
  }
}
