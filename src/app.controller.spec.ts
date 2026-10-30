import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from './app.controller';
import {
  AGENT_SERVICE,
  IAgentService,
  RagAgentError,
} from './agent/service/agentServiceInterface';
import { err, okey } from './shared/result';

describe('AppController GET / (question)', () => {
  let app: INestApplication<App>;
  const askRAGagent = jest.fn<
    ReturnType<IAgentService['askRAGagent']>,
    [string]
  >();

  beforeEach(async () => {
    askRAGagent.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AGENT_SERVICE, useValue: { askRAGagent } }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 with the agent answer', async () => {
    askRAGagent.mockResolvedValue(okey('Some answer'));

    const response = await request(app.getHttpServer())
      .get('/')
      .query({ question: 'What is this?' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('Some answer');
    expect(askRAGagent).toHaveBeenCalledWith('What is this?');
  });

  it('trims the question before calling the agent', async () => {
    askRAGagent.mockResolvedValue(okey('ok'));

    await request(app.getHttpServer()).get('/').query({ question: '  hi  ' });

    expect(askRAGagent).toHaveBeenCalledWith('hi');
  });

  it('returns 400 when the question is missing', async () => {
    const response = await request(app.getHttpServer()).get('/');

    expect(response.status).toBe(400);
    expect(askRAGagent).not.toHaveBeenCalled();
  });

  it('returns 400 when the question is blank', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .query({ question: '   ' });

    expect(response.status).toBe(400);
    expect(askRAGagent).not.toHaveBeenCalled();
  });

  it('returns 502 when the agent returns an empty response', async () => {
    askRAGagent.mockResolvedValue(err(RagAgentError.EmptyResponse));

    const response = await request(app.getHttpServer())
      .get('/')
      .query({ question: 'Anything' });

    expect(response.status).toBe(502);
  });
});
