import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/databaseModule';
import { EmbeddingModule } from '../embedding/embeddingModule';
import { AGENT_SERVICE } from './service/agentServiceInterface';
import { AgentService } from './service/agentService';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, EmbeddingModule],
  providers: [{ provide: AGENT_SERVICE, useClass: AgentService }],
  exports: [AGENT_SERVICE],
})
export class AgentModule {}
