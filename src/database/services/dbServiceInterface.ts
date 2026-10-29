export const DB_SERVICE = Symbol('DB_SERVICE');

import { Result } from 'src/shared/result';
import { DocumentMatch } from '../domain/documentModel';

export interface IDbService {
  insertEmbedding(content: string, embedding: number[]): Promise<void>;
  findClosestFive(
    embedding: number[],
  ): Promise<Result<DocumentMatch[], findClosestError>>;
}

export enum findClosestError {
  NotMatchesFound,
}
