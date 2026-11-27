import { MigrationInterface, QueryRunner } from 'typeorm';

export class UniqueUserEmail1732450000000 implements MigrationInterface {
  name = 'UniqueUserEmail1732450000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "user" SET email = lower(btrim(email))`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_email_unique"
      ON "user" (email)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_email_unique"`);
  }
}
