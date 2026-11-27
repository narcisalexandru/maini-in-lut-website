import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminTableRevisions1764030000000 implements MigrationInterface {
  name = 'AdminTableRevisions1764030000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "admin_audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'CUSTOMER_UPDATED'
    `);
    await queryRunner.query(`
      ALTER TYPE "admin_audit_logs_targetType_enum" ADD VALUE IF NOT EXISTS 'CUSTOMER'
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_table_revisions" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "tableKey" character varying(80) NOT NULL,
        "sequence" integer NOT NULL,
        "summary" character varying(240) NOT NULL,
        "kind" character varying(40) NOT NULL,
        "targetId" integer NOT NULL,
        "field" character varying(40) NOT NULL,
        "fieldLabel" character varying(80) NOT NULL,
        "rowLabel" character varying(200) NOT NULL,
        "previousValue" jsonb,
        "nextValue" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_admin_table_revisions_user_table_sequence" UNIQUE ("userId", "tableKey", "sequence")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_table_cursors" (
        "id" SERIAL PRIMARY KEY,
        "userId" integer NOT NULL,
        "tableKey" character varying(80) NOT NULL,
        "cursor" integer NOT NULL DEFAULT 0,
        CONSTRAINT "UQ_admin_table_cursors_user_table" UNIQUE ("userId", "tableKey")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_table_cursors"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_table_revisions"`);
  }
}
