import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import {
  EMBEDDING_SERVICE,
  EmbedMarkdownError,
} from './services/embeddingServiceInterface';
import type { IEmbeddingService } from './services/embeddingServiceInterface';

async function main(): Promise<void> {
  const filePath = process.argv[2] ?? 'cv_markdown.md';
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const service = app.get<IEmbeddingService>(EMBEDDING_SERVICE);
    const result = await service.embedMarkdownFile(filePath);
    if (result.IsSuccess) {
      console.log(`Ingested ${result.value.chunks} chunks from ${filePath}`);
    } else {
      console.error(`Ingestion failed: ${EmbedMarkdownError[result.error]}`);
      process.exitCode = 1;
    }
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
