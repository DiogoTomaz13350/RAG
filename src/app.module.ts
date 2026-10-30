import { Module } from '@nestjs/common';
import { AgentModule } from './agent/agentModule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/databaseModule';
import { EmbeddingModule } from './embedding/embeddingModule';

@Module({
  imports: [DatabaseModule, EmbeddingModule, AgentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
