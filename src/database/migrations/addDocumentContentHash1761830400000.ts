import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentContentHash1761830400000 implements MigrationInterface {
  name = 'AddDocumentContentHash1761830400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE documents ADD COLUMN content_hash CHAR(64)',
    );
    await queryRunner.query(`
      UPDATE documents
      SET content_hash = encode(sha256(convert_to(content, 'UTF8')), 'hex')
    `);
    await queryRunner.query(
      'ALTER TABLE documents ALTER COLUMN content_hash SET NOT NULL',
    );
    await queryRunner.query(`
      ALTER TABLE documents
      ADD CONSTRAINT documents_content_hash_key UNIQUE (content_hash)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE documents DROP CONSTRAINT documents_content_hash_key',
    );
    await queryRunner.query('ALTER TABLE documents DROP COLUMN content_hash');
  }
}
