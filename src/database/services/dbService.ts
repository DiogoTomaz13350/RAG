import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IDbService } from './dbServiceInterface';
import { Document, DocumentMatch } from '../domain/documentModel';

@Injectable()
export class DbService implements IDbService {
  constructor(private readonly dataSource: DataSource) {}

  async findAll(): Promise<Document[]> {
    const rows: { id: string; content: string; embedding: string }[] =
      await this.dataSource.query(
        'SELECT id, content, embedding::text AS embedding FROM documents',
      );
    return rows.map(
      (row) =>
        new Document(
          row.id,
          row.content,
          JSON.parse(row.embedding) as number[],
        ),
    );
  }

  async findClosest(embedding: number[], limit = 5): Promise<DocumentMatch[]> {
    const vector: string = `[${embedding.join(',')}]`;
    const rows: { id: string; content: string; distance: number }[] =
      await this.dataSource.query(
        `SELECT id, content, embedding <=> $1::vector AS distance
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [vector, limit],
      );
    return rows.map(
      (row) => new DocumentMatch(row.id, row.content, row.distance),
    );
  }
}
