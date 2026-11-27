import { MigrationInterface, QueryRunner } from 'typeorm';

export class InboxBroadcast1764120000000 implements MigrationInterface {
  name = 'InboxBroadcast1764120000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inbox_thread" ALTER COLUMN "artistId" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread"
      ADD COLUMN IF NOT EXISTS "kind" character varying(32) NOT NULL DEFAULT 'direct'
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread"
      ADD COLUMN IF NOT EXISTS "broadcastId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread"
      ADD COLUMN IF NOT EXISTS "spawnedFromBroadcastId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread"
      ADD COLUMN IF NOT EXISTS "linkedThreadId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread"
      ADD COLUMN IF NOT EXISTS "repliesDisabled" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread"
      ADD COLUMN IF NOT EXISTS "hiddenFromAdmin" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "inbox_thread" DROP COLUMN IF EXISTS "hiddenFromAdmin"
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread" DROP COLUMN IF EXISTS "repliesDisabled"
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread" DROP COLUMN IF EXISTS "linkedThreadId"
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread" DROP COLUMN IF EXISTS "spawnedFromBroadcastId"
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread" DROP COLUMN IF EXISTS "broadcastId"
    `);
    await queryRunner.query(`
      ALTER TABLE "inbox_thread" DROP COLUMN IF EXISTS "kind"
    `);
  }
}
