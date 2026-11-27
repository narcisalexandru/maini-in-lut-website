import { MigrationInterface, QueryRunner } from 'typeorm';

export class SmartbillInvoices1764060000000 implements MigrationInterface {
  name = 'SmartbillInvoices1764060000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "order_invoicestatus_enum" AS ENUM ('ISSUING', 'ISSUED', 'FAILED');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceStatus" "order_invoicestatus_enum"
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceSeries" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceNumber" character varying
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceDocumentId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceDocumentUrl" text
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceViewUrl" text
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceError" text
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceIssuedAt" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceAttemptAt" TIMESTAMP WITH TIME ZONE
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "invoiceIsDraft" boolean NOT NULL DEFAULT false
    `);
    await this.addEnumValue(queryRunner, 'admin_audit_logs_action_enum', 'INVOICE_ISSUED');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceIsDraft"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceAttemptAt"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceIssuedAt"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceError"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceViewUrl"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceDocumentUrl"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceDocumentId"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceNumber"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceSeries"`);
    await queryRunner.query(`ALTER TABLE "order" DROP COLUMN IF EXISTS "invoiceStatus"`);
  }

  private async addEnumValue(
    queryRunner: QueryRunner,
    typeName: string,
    value: string,
  ): Promise<void> {
    const existing = (await queryRunner.query(
      `SELECT 1 FROM pg_type WHERE typname = $1`,
      [typeName],
    )) as unknown[];
    if (!existing.length) {
      return;
    }
    await queryRunner.query(
      `ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}'`,
    );
  }
}
