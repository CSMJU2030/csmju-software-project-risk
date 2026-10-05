import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('api')
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'software-project-risk',
    };
  }
}
