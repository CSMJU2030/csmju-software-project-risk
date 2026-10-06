import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('api')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: this.config.get<string>('subsystemId') ?? 'csmju-software-project-risk',
    };
  }
}
