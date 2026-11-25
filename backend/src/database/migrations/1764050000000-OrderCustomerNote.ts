import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderCustomerNote1764050000000 implements MigrationInterface {
  name = 'OrderCustomerNote1764050000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "customerNote" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "order" DROP COLUMN IF EXISTS "customerNote"
    `);
  }
}
