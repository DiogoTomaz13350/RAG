import { Result } from '../../shared/result';

export const AGENT_SERVICE = Symbol('AGENT_SERVICE');

export enum RagAgentError {
  EmptyResponse,
}

export interface IAgentService {
  askRAGagent(prompt: string): Promise<Result<string, RagAgentError>>;
}
