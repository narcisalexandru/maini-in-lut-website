import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderArchiveAndDelete1764070000000 implements MigrationInterface {
  name = 'OrderArchiveAndDelete1764070000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_item"
      ADD COLUMN IF NOT EXISTS "isManuallyArchived" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TYPE "admin_audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'ORDER_ARCHIVED'
    `);
    await queryRunner.query(`
      ALTER TYPE "admin_audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'ORDER_DELETED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order_item" DROP COLUMN IF EXISTS "isManuallyArchived"
    `);
  }
}
