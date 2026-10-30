import {
  BadGatewayException,
  BadRequestException,
  Controller,
  Get,
  Inject,
  Query,
} from '@nestjs/common';
import {
  AGENT_SERVICE,
  RagAgentError,
} from './agent/service/agentServiceInterface';
import type { IAgentService } from './agent/service/agentServiceInterface';
import { z } from 'zod';

const questionSchema = z.string().trim().min(1);

@Controller()
export class AppController {
  constructor(
    @Inject(AGENT_SERVICE) private readonly agentService: IAgentService,
  ) {}

  @Get()
  async questionAI(@Query('question') question?: string): Promise<string> {
    const parsed = questionSchema.safeParse(question);
    if (!parsed.success) {
      throw new BadRequestException('Query parameter "question" is required');
    }

    const answer = await this.agentService.askRAGagent(parsed.data);
    if (answer.IsSuccess) {
      return answer.value;
    }

    switch (answer.error) {
      case RagAgentError.EmptyResponse:
        throw new BadGatewayException('Empty response from agent');
    }
  }
}
