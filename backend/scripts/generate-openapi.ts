import 'dotenv/config';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function main(): Promise<void> {
  const backendRoot = resolve(__dirname, '..');

  execSync('pnpm exec prisma generate', {
    cwd: backendRoot,
    stdio: 'inherit',
  });

  const { AppModule } = await import('../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  const config = new DocumentBuilder()
    .setTitle('SoftwareProjectRisk API')
    .setDescription('Software Project Risk Analysis & What-if Simulation API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  writeFileSync(resolve(process.cwd(), 'openapi.json'), JSON.stringify(document, null, 2));
  await app.close();
}

void main();
