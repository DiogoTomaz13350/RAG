export const DB_SERVICE = Symbol('DB_SERVICE');

import { Document, DocumentMatch } from '../domain/documentModel';

export interface IDbService {
  findAll(): Promise<Document[]>;
  findClosest(embedding: number[], limit?: number): Promise<DocumentMatch[]>;
}
