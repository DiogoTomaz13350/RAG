import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DataSource } from 'typeorm';
import { IDbService, findClosestError } from './dbServiceInterface';
import { DocumentMatch } from '../domain/documentModel';
import { err, okey, Result } from 'src/shared/result';

@Injectable()
export class DbService implements IDbService {
  constructor(private readonly dataSource: DataSource) {}

  async insertEmbedding(content: string, embedding: number[]): Promise<void> {
    const vector: string = `[${embedding.join(',')}]`;
    const contentHash: string = createHash('sha256')
      .update(content, 'utf8')
      .digest('hex');
    await this.dataSource.query(
      `INSERT INTO documents (content, content_hash, embedding)
       VALUES ($1, $2, $3::vector)
       ON CONFLICT (content_hash) DO NOTHING`,
      [content, contentHash, vector],
    );
  }

  async findClosestFive(
    embedding: number[],
  ): Promise<Result<DocumentMatch[], findClosestError>> {
    const vector: string = `[${embedding.join(',')}]`;
    const rows: { id: string; content: string; distance: number }[] =
      await this.dataSource.query(
        `SELECT id, content, embedding <=> $1::vector AS distance
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT 5`,
        [vector],
      );
    if (rows.length === 0) {
      return err(findClosestError.NotMatchesFound);
    }

    return okey(
      rows.map((row) => new DocumentMatch(row.id, row.content, row.distance)),
    );
  }
}
