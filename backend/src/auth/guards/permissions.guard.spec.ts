import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthEventsLogger } from '../auth-events.logger';
import { CoreHubIdentity, SubsystemRole } from '../core-hub-identity';
import { Permission } from '../permissions';
import { PermissionsGuard } from './permissions.guard';

function contextFor(user?: CoreHubIdentity): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user, path: '/api/v1/projects' }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function identity(role: SubsystemRole): CoreHubIdentity {
  return {
    id: 'user-001',
    email: 'user@core.local',
    coreRole: role.toLowerCase(),
    subsystemRole: role,
  };
}

describe('PermissionsGuard - authorization tests (spec §15, §36)', () => {
  const reflector = new Reflector();
  const guard = new PermissionsGuard(reflector, new AuthEventsLogger());

  function requirePermissions(...permissions: Permission[]): void {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permissions);
  }

  afterEach(() => jest.restoreAllMocks());

  it('allows a route with no permission metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextFor(identity(SubsystemRole.STUDENT)))).toBe(true);
  });

  it('allows STAFF to read projects', () => {
    requirePermissions(Permission.PROJECT_READ_ANY);
    expect(guard.canActivate(contextFor(identity(SubsystemRole.STAFF)))).toBe(true);
  });

  it('allows STUDENT to create projects', () => {
    requirePermissions(Permission.PROJECT_CREATE);
    expect(guard.canActivate(contextFor(identity(SubsystemRole.STUDENT)))).toBe(true);
  });

  it('denies ALUMNI from deleting projects with 403', () => {
    requirePermissions(Permission.PROJECT_DELETE_ANY);
    expect(() => guard.canActivate(contextFor(identity(SubsystemRole.ALUMNI)))).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });

  it('passes when the role holds any one of the required permissions', () => {
    requirePermissions(Permission.PROJECT_CREATE, Permission.PROJECT_READ_ANY);
    expect(guard.canActivate(contextFor(identity(SubsystemRole.STAFF)))).toBe(true);
  });

  it('returns 401 when no verified identity is present', () => {
    requirePermissions(Permission.PROJECT_READ_ANY);
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });
});
