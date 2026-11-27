import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderNoteEdits1764080000000 implements MigrationInterface {
  name = 'OrderNoteEdits1764080000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "admin_audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'ORDER_NOTE_UPDATED'
    `);
  }

  public async down(): Promise<void> {
    return;
  }
}
