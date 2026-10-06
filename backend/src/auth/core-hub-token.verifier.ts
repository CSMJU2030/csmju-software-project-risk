import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeProtectedHeader, errors as joseErrors, jwtVerify } from 'jose';
import { CoreHubTokenPayload } from './core-hub-identity';
import { JwksService } from './jwks.service';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';

const REQUIRED_ALGORITHM = 'RS256';
const MAX_ACCESS_TOKEN_AGE_SEC = 900;
const ACCESS_TOKEN_AGE_TOLERANCE_SEC = 60;

@Injectable()
export class CoreHubTokenVerifier {
  constructor(
    private readonly jwks: JwksService,
    private readonly config: ConfigService,
  ) {}

  async verify(token: string): Promise<CoreHubTokenPayload> {
    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new TokenVerificationError(TokenRejectionReason.MISSING_TOKEN, 'No token supplied');
    }

    let header: ReturnType<typeof decodeProtectedHeader>;
    try {
      header = decodeProtectedHeader(token);
    } catch {
      throw new TokenVerificationError(TokenRejectionReason.MALFORMED_TOKEN, 'Token is not a well-formed JWT');
    }

    if (header.alg !== REQUIRED_ALGORITHM) {
      throw new TokenVerificationError(TokenRejectionReason.UNSUPPORTED_ALGORITHM, 'Only RS256 tokens are accepted', header.kid);
    }
    if (typeof header.kid !== 'string' || header.kid.length === 0) {
      throw new TokenVerificationError(TokenRejectionReason.MISSING_KID, 'Token header does not contain a key id');
    }

    const key = await this.jwks.getKey(header.kid);
    let payload: CoreHubTokenPayload;
    try {
      const result = await jwtVerify(token, key, {
        algorithms: [REQUIRED_ALGORITHM],
        issuer: this.config.get<string>('coreHub.issuer', 'core-hub'),
        audience: this.config.get<string>('coreHub.audience', 'csmju2030'),
        clockTolerance: this.config.get<number>('coreHub.clockToleranceSec', 60),
      });
      payload = result.payload as unknown as CoreHubTokenPayload;
    } catch (error) {
      throw this.translate(error, header.kid);
    }

    if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
      throw new TokenVerificationError(TokenRejectionReason.INVALID_CLAIMS, 'Token has no subject claim', header.kid);
    }

    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
      throw new TokenVerificationError(TokenRejectionReason.INVALID_CLAIMS, 'Token must contain iat and exp', header.kid);
    }

    if (payload.exp - payload.iat > MAX_ACCESS_TOKEN_AGE_SEC + ACCESS_TOKEN_AGE_TOLERANCE_SEC) {
      throw new TokenVerificationError(TokenRejectionReason.INVALID_CLAIMS, 'Token lifetime exceeds the access-token limit', header.kid);
    }

    const azp = (payload as CoreHubTokenPayload & { azp?: unknown }).azp;
    const subsystemId = this.config.get<string>('subsystemId', 'software-project-risk');
    if (azp !== undefined && azp !== subsystemId) {
      throw new TokenVerificationError(TokenRejectionReason.INVALID_CLAIMS, 'Token was issued for another subsystem', header.kid);
    }

    return payload;
  }

  private translate(error: unknown, kid: string): TokenVerificationError {
    if (error instanceof TokenVerificationError) return error;
    if (error instanceof joseErrors.JWTExpired) {
      return new TokenVerificationError(TokenRejectionReason.EXPIRED, 'Token has expired', kid);
    }
    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      if (error.claim === 'iss') return new TokenVerificationError(TokenRejectionReason.INVALID_ISSUER, 'Token issuer is not the Core Hub', kid);
      if (error.claim === 'aud') return new TokenVerificationError(TokenRejectionReason.INVALID_AUDIENCE, 'Token audience does not include this platform', kid);
      return new TokenVerificationError(TokenRejectionReason.INVALID_CLAIMS, `Token claim "${error.claim}" is invalid`, kid);
    }
    if (error instanceof joseErrors.JOSEError && error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      return new TokenVerificationError(TokenRejectionReason.INVALID_SIGNATURE, 'Token signature verification failed', kid);
    }
    return new TokenVerificationError(TokenRejectionReason.MALFORMED_TOKEN, 'Token could not be verified', kid);
  }
}
