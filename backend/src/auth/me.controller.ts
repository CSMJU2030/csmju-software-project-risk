import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { CoreHubIdentity } from './core-hub-identity';

/** GET /api/v1/me - returns the verified Core Hub identity. */
@Controller('me')
export class MeController {
  @Get()
  me(@CurrentUser() user: CoreHubIdentity) {
    return {
      id: user.id,
      email: user.email,
      coreRole: user.coreRole,
      subsystemRole: user.subsystemRole,
    };
  }
}
