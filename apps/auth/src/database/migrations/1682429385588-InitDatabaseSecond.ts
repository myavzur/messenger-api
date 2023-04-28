import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabaseSecond1682429385588 implements MigrationInterface {
    name = 'InitDatabaseSecond1682429385588'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "account_name" TO "name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "name" TO "account_name"`);
    }

}
