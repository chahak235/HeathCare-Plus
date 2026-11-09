import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isRailway = Boolean(process.env.DATABASE_URL);

export const AppDataSource = new DataSource(
  isRailway
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
        synchronize: false,
        logging: false,
        entities: ['dist/entities/**/*.js'],
        migrations: ['dist/migrations/**/*.js'],
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root',
        database: process.env.DB_NAME || 'healthcare_db',
        synchronize: false,
        logging: true,
        entities: ['src/entities/**/*.ts'],
        migrations: ['src/migrations/**/*.ts'],
      }
);
