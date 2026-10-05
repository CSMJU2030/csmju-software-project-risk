import { randomBytes } from 'node:crypto';
import { Controller, Get, Headers, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AppException } from '../common/errors';
import { AuthEventsLogger } from './auth-events.logger';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { Public } from './decorators/public.decorator';
import { SsoCallbackQueryDto } from './dto/sso-callback.dto';
import { mapCoreRoleToSubsystemRole } from './role-mapping';
import {
  SSO_COOKIE_NAME,
  SSO_STATE_COOKIE_NAME,
  buildSsoCookie,
  buildStateCookie,
  clearCookie,
  parseStateCookie,
  readCookie,
} from './sso-session';

@Controller('auth')
export class SsoCallbackController {
  constructor(
    private readonly verifier: CoreHubTokenVerifier,
    private readonly authEvents: AuthEventsLogger,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get('login')
  login(
    @Query('next') requestedNext: string | undefined,
    @Res() response: Response,
  ): void {
    const state = randomBytes(32).toString('base64url');
    const next = this.safeNext(requestedNext);
    const secure = this.config.get<string>('nodeEnv') === 'production';
    const coreHubWebUrl = this.config.get<string>('coreHub.webUrl');

    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Set-Cookie', buildStateCookie(state, next, secure));
    response.redirect(302, `${coreHubWebUrl}/api/sso/${encodeURIComponent(this.config.get<string>("subsystemId")!)}`);
  }

  @Public()
  @Get('callback')
  async callback(
    @Query() query: SsoCallbackQueryDto,
    @Headers('cookie') cookieHeader: string | undefined,
    @Headers('accept') accept: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const secure = this.config.get<string>('nodeEnv') === 'production';
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');

    const stateCookie = readCookie(cookieHeader, SSO_STATE_COOKIE_NAME);
    if (query.state === undefined) {
      response.redirect(302, '/auth/login');
      return;
    }

    response.append('Set-Cookie', clearCookie(SSO_STATE_COOKIE_NAME, secure));
    const state = parseStateCookie(stateCookie);
    if (!state || state.state !== query.state) {
      if (accept?.includes('text/html')) {
        response.status(401).send('<!doctype html><title>SSO Login Required</title><p>เซสชันเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง</p><a href="/auth/login">เข้าสู่ระบบอีกครั้ง</a>');
        return;
      }
      response.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid SSO state' } });
      return;
    }

    let payload;
    try {
      payload = await this.verifier.verify(query.access_token);
    } catch (error) {
      const reason = error instanceof TokenVerificationError ? error.reason : TokenRejectionReason.MALFORMED_TOKEN;
      const kid = error instanceof TokenVerificationError ? error.kid : undefined;
      this.authEvents.jwtRejected({ reason, kid, path: '/auth/callback' });
      throw AppException.unauthorized('The Core Hub SSO token could not be verified');
    }

    const subsystemRole = mapCoreRoleToSubsystemRole(payload.role);
    if (!subsystemRole) {
      this.authEvents.roleMappingFailed({ sub: payload.sub, coreRole: payload.role });
      throw AppException.forbidden('Your Core Hub role has no access to this subsystem');
    }

    const expiresInSec = this.remainingLifetimeSec(payload.exp);
    response.append('Set-Cookie', buildSsoCookie(query.access_token, expiresInSec, secure));
    this.authEvents.jwtVerified({ sub: payload.sub, coreRole: payload.role, subsystemRole });
    response.redirect(302, state.next);
  }

  @Public()
  @Post('logout')
  logout(@Res() response: Response): void {
    const secure = this.config.get<string>('nodeEnv') === 'production';
    const coreHubWebUrl = this.config.get<string>('coreHub.webUrl');
    response.setHeader('Cache-Control', 'no-store');
    response.append('Set-Cookie', clearCookie(SSO_COOKIE_NAME, secure));
    response.append('Set-Cookie', clearCookie(SSO_STATE_COOKIE_NAME, secure));
    response.redirect(303, `${coreHubWebUrl}/logout`);
  }

  private safeNext(next: string | undefined): string {
    if (!next || next.length > 512) return '/';
    if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
    if (next.includes('\\') || [...next].some((char) => {
      const code = char.charCodeAt(0);
      return code <= 31 || code === 127;
    })) return '/';
    if (next === '/auth' || next.startsWith('/auth/')) return '/';

    try {
      const origin = this.config.get<string>('coreHub.webUrl') ?? 'http://localhost:3000';
      const url = new URL(next, origin);
      if (url.origin !== origin.replace(/\/+$/, '')) return '/';
    } catch {
      return '/';
    }

    return next;
  }

  private remainingLifetimeSec(exp: number | undefined): number {
    if (typeof exp !== 'number') return 0;
    return Math.max(0, exp - Math.floor(Date.now() / 1000));
  }
}
