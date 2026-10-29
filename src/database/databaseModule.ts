import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbService } from './services/dbService';
import { DB_SERVICE } from './services/dbServiceInterface';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('POSTGRES_HOST'),
        port: Number(config.getOrThrow<string>('POSTGRES_PORT')),
        username: config.getOrThrow<string>('POSTGRES_USER'),
        password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: config.getOrThrow<string>('POSTGRES_DB'),
        synchronize: false,
        migrationsRun: false,
      }),
    }),
  ],
  providers: [{ provide: DB_SERVICE, useClass: DbService }],
  exports: [DB_SERVICE],
})
export class DatabaseModule {}
