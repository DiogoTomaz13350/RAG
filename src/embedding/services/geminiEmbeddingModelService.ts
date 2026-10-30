import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmbeddingModel } from './geminiEmbeddingModelInterfaceService';
import { err, okey, Result } from 'src/shared/result';
import { EmbeddingModelError } from './geminiEmbeddingModelInterfaceService';

@Injectable()
export class GeminiEmbeddingModel implements IEmbeddingModel {
  constructor(private readonly config: ConfigService) {}

  async embed(text: string): Promise<Result<number[], EmbeddingModelError>> {
    const response: Response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.getOrThrow<string>('GEMINI_API_KEY'),
        },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: 1536,
        }),
      },
    );
    if (!response.ok) {
      return err(EmbeddingModelError.FailedToEmbed);
    }

    const data = (await response.json()) as { embedding: { values: number[] } };
    return okey(data.embedding.values);
  }
}
