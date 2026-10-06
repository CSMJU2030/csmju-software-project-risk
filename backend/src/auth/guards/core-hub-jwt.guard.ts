import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AppException } from '../../common/errors';
import { AuthEventsLogger } from '../auth-events.logger';
import {
  TokenRejectionReason,
  TokenVerificationError,
} from '../auth.errors';
import { CoreHubIdentity } from '../core-hub-identity';
import { CoreHubTokenVerifier } from '../core-hub-token.verifier';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { mapCoreRoleToSubsystemRole } from '../role-mapping';
import { SSO_COOKIE_NAME, readCookie } from '../sso-session';

/**
 * Authentication guard (spec §12).
 *
 * Development mode:
 * - Allows standalone testing without a Core Hub token.
 *
 * Production:
 * - Requires a valid Core Hub Bearer access token.
 * - Verifies the token against Core Hub JWKS.
 * - Maps the Core Hub role to the subsystem role.
 */
@Injectable()
export class CoreHubJwtGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: CoreHubTokenVerifier,
    private readonly authEvents: AuthEventsLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest<
          Request & {
            user?: CoreHubIdentity;
            coreHubAccessToken?: string;
          }
        >();

    const token =
      this.extractBearerToken(request.header('authorization')) ??
      readCookie(request.header('cookie'), SSO_COOKIE_NAME);

    if (!token) {
      this.authEvents.jwtRejected({
        reason: TokenRejectionReason.MISSING_TOKEN,
        path: request.path,
      });

      throw AppException.unauthorized(
        'A Core Hub Bearer access token is required',
      );
    }

    let payload;

    try {
      payload = await this.verifier.verify(token);
    } catch (error) {
      const reason =
        error instanceof TokenVerificationError
          ? error.reason
          : TokenRejectionReason.MALFORMED_TOKEN;

      const kid =
        error instanceof TokenVerificationError ? error.kid : undefined;

      this.authEvents.jwtRejected({
        reason,
        kid,
        path: request.path,
      });

      throw AppException.unauthorized(
        'Invalid or expired Core Hub access token',
      );
    }

    // Core role -> subsystem role.
    const subsystemRole = mapCoreRoleToSubsystemRole(payload.role);

    if (!subsystemRole) {
      this.authEvents.roleMappingFailed({
        sub: payload.sub,
        coreRole: payload.role,
      });

      throw AppException.forbidden(
        'Your Core Hub role has no access to this subsystem',
      );
    }

    const identity: CoreHubIdentity = {
      id: payload.sub,
      email: payload.email ?? '',
      coreRole: payload.role as string,
      sessionId: payload.sid,
      subsystemRole,
    };

    request.user = identity;
    request.coreHubAccessToken = token;

    // Token ที่ตรวจผ่านแล้ว สำหรับส่งต่อไป Core Hub
    // ห้าม log token
    this.authEvents.jwtVerified({
      sub: identity.id,
      coreRole: identity.coreRole,
      subsystemRole: identity.subsystemRole,
    });

    return true;
  }

  /**
   * Authorization: Bearer <token>
   * Scheme match is case-insensitive.
   */
  private extractBearerToken(
    header: string | undefined,
  ): string | null {
    if (!header) {
      return null;
    }

    const [scheme, value, ...rest] = header.trim().split(/\s+/);

    if (
      rest.length > 0 ||
      scheme?.toLowerCase() !== 'bearer' ||
      !value
    ) {
      return null;
    }

    return value;
  }
}

