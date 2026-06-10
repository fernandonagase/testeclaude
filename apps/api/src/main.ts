import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors();
  app.enableShutdownHooks();
  await app.listen(env.PORT);
  console.log(JSON.stringify({ msg: 'api up', port: env.PORT, env: env.NODE_ENV }));
}

void bootstrap();
