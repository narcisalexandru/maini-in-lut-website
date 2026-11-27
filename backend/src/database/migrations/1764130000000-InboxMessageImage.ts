import { MigrationInterface, QueryRunner } from 'typeorm';

export class InboxMessageImage1764130000000 implements MigrationInterface {
  name = 'InboxMessageImage1764130000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inbox_message" ADD COLUMN IF NOT EXISTS "imageUrl" character varying(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inbox_message" DROP COLUMN IF EXISTS "imageUrl"`,
    );
  }
}
