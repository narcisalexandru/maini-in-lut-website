import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrderDeliveryEdits1764040000000 implements MigrationInterface {
  name = 'OrderDeliveryEdits1764040000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "admin_audit_logs_action_enum" ADD VALUE IF NOT EXISTS 'ORDER_DELIVERY_UPDATED'
    `);
    await queryRunner.query(`
      ALTER TABLE "order" ALTER COLUMN "deliveryStreet" TYPE character varying(500)
    `);
  }

  public async down(): Promise<void> {
    return;
  }
}
