import 'dotenv/config';
import { DataSource } from 'typeorm';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set in .env`);
  }
  return value;
}

export default new DataSource({
  type: 'postgres',
  host: requireEnv('POSTGRES_HOST'),
  port: Number(requireEnv('POSTGRES_PORT')),
  username: requireEnv('POSTGRES_USER'),
  password: requireEnv('POSTGRES_PASSWORD'),
  database: requireEnv('POSTGRES_DB'),
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});
