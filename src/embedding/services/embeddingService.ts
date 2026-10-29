import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { DB_SERVICE } from '../../database/services/dbServiceInterface';
import type { IDbService } from '../../database/services/dbServiceInterface';
import { err, okey, Result } from '../../shared/result';
import { EMBEDDING_MODEL } from './geminiEmbeddingModelInterfaceService';
import type { IEmbeddingModel } from './geminiEmbeddingModelInterfaceService';
import {
  EmbedMarkdownError,
  EmbedSummary,
  IEmbeddingService,
} from './embeddingServiceInterface';
import { splitSentences } from '../auxiliary/sentenceSplitter';

@Injectable()
export class EmbeddingService implements IEmbeddingService {
  constructor(
    @Inject(DB_SERVICE) private readonly db: IDbService,
    @Inject(EMBEDDING_MODEL) private readonly model: IEmbeddingModel,
  ) {}

  async embedMarkdownFile(
    filePath: string,
  ): Promise<Result<EmbedSummary, EmbedMarkdownError>> {
    let text: string;
    try {
      text = await readFile(resolve(filePath), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return err(EmbedMarkdownError.FileNotFound);
      }
      throw error;
    }

    const chunks = splitSentences(text);
    if (chunks.length === 0) {
      return err(EmbedMarkdownError.NoChunks);
    }

    for (const chunk of chunks) {
      const embedding = await this.model.embed(chunk);
      if (!embedding.IsSuccess) {
        return err(EmbedMarkdownError.EmbeddingFailed);
      }
      await this.db.insertEmbedding(chunk, embedding.value);
    }
    return okey({ chunks: chunks.length });
  }
}
