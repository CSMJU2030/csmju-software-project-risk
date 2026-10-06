import 'dotenv/config';
import { Logger, RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupApp(app);

  // CSMJU2030: frontend is the subsystem gateway; business APIs live under /api/v1.
  // Health and SSO callback are public routes outside the versioned API prefix.
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'api/health', method: RequestMethod.GET },
      { path: 'auth/login', method: RequestMethod.GET },
      { path: 'auth/callback', method: RequestMethod.GET },
      { path: 'auth/logout', method: RequestMethod.POST },
    ],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SoftwareProjectRisk API')
    .setDescription('Software Project Risk Analysis & What-if Simulation API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4201);
  await app.listen(port);
  new Logger('Bootstrap').log(
    JSON.stringify({
      event: 'subsystem.started',
      subsystem: process.env.SUBSYSTEM_ID ?? 'software-project-risk',
      port,
      coreHubUrl: process.env.CORE_HUB_URL,
      jwksUrl: process.env.CORE_HUB_JWKS_URL,
    }),
  );
}

void bootstrap();
