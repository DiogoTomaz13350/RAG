import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/databaseModule';
import { GeminiEmbeddingModel } from './services/geminiEmbeddingModelService';
import { EMBEDDING_MODEL } from './services/geminiEmbeddingModelInterfaceService';
import { EmbeddingService } from './services/embeddingService';
import { EMBEDDING_SERVICE } from './services/embeddingServiceInterface';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule],
  providers: [
    { provide: EMBEDDING_MODEL, useClass: GeminiEmbeddingModel },
    { provide: EMBEDDING_SERVICE, useClass: EmbeddingService },
  ],
  exports: [EMBEDDING_SERVICE],
})
export class EmbeddingModule {}
