import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocuments1761744000000 implements MigrationInterface {
  name = 'CreateDocuments1761744000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS vector');
    await queryRunner.query(`
      CREATE TABLE documents (
          id BIGSERIAL PRIMARY KEY,
          content TEXT NOT NULL,
          embedding VECTOR(1536) NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX documents_embedding_idx
      ON documents
      USING hnsw (embedding vector_cosine_ops)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX documents_embedding_idx');
    await queryRunner.query('DROP TABLE documents');
  }
}
