import { ConfigService } from '@nestjs/config';
import { GeminiEmbeddingModel } from './geminiEmbeddingModelService';
import {
  EmbeddingModelError,
  EmbeddingTaskType,
} from './geminiEmbeddingModelInterfaceService';

describe('GeminiEmbeddingModel', () => {
  const config = {
    getOrThrow: () => 'fake-api-key',
  } as unknown as ConfigService;
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const sentTaskType = (): string => {
    const [, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    return (JSON.parse(init.body) as { taskType: string }).taskType;
  };

  it.each([
    [EmbeddingTaskType.Document, 'RETRIEVAL_DOCUMENT'],
    [EmbeddingTaskType.Query, 'RETRIEVAL_QUERY'],
  ])('sends the %s task type to Gemini', async (taskType, expected) => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ embedding: { values: [0.1, 0.2] } }),
    });

    const result = await new GeminiEmbeddingModel(config).embed(
      'some text',
      taskType,
    );

    expect(sentTaskType()).toBe(expected);
    expect(result).toEqual({ IsSuccess: true, value: [0.1, 0.2] });
  });

  it('returns FailedToEmbed when Gemini responds with an error', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    const result = await new GeminiEmbeddingModel(config).embed(
      'some text',
      EmbeddingTaskType.Query,
    );

    expect(result).toEqual({
      IsSuccess: false,
      error: EmbeddingModelError.FailedToEmbed,
    });
  });
});
