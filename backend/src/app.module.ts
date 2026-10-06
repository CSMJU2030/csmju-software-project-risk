import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CoreHubJwtGuard } from './auth/guards/core-hub-jwt.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RisksModule } from './risks/risks.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { SimulationsModule } from './simulations/simulations.module';
import { TaskDependenciesModule } from './task-dependencies/task-dependencies.module';
import { TasksModule } from './tasks/tasks.module';
import { HealthModule } from './common/health/health.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    AuthModule,
    HealthModule,
    PrismaModule,
    ProjectsModule,
    TasksModule,
    TaskDependenciesModule,
    RisksModule,
    ScenariosModule,
    SimulationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: CoreHubJwtGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
