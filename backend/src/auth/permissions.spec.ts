import { SubsystemRole } from './core-hub-identity';
import { Permission, ROLE_PERMISSIONS, can, canAny } from './permissions';

describe('SoftwareProjectRisk permission model', () => {
  it('student can manage own projects while alumni can only read', () => {
    expect(can(SubsystemRole.STUDENT, Permission.PROJECT_CREATE)).toBe(true);
    expect(can(SubsystemRole.STUDENT, Permission.PROJECT_UPDATE_OWN)).toBe(true);
    expect(can(SubsystemRole.STUDENT, Permission.PROJECT_DELETE_OWN)).toBe(true);
    expect(can(SubsystemRole.ALUMNI, Permission.PROJECT_READ_ANY)).toBe(true);
    expect(can(SubsystemRole.ALUMNI, Permission.PROJECT_CREATE)).toBe(false);
    expect(can(SubsystemRole.ALUMNI, Permission.PROJECT_UPDATE_OWN)).toBe(false);
    expect(can(SubsystemRole.ALUMNI, Permission.PROJECT_DELETE_OWN)).toBe(false);
  });

  it('staff can manage projects', () => {
    for (const permission of Object.values(Permission)) {
      expect(can(SubsystemRole.STAFF, permission)).toBe(true);
    }
  });

  it('admin can manage projects', () => {
    for (const permission of Object.values(Permission)) {
      expect(can(SubsystemRole.ADMIN, permission)).toBe(true);
    }
  });

  it('canAny returns true only when at least one permission matches', () => {
    expect(canAny(SubsystemRole.STUDENT, [Permission.PROJECT_READ_ANY])).toBe(true);
    expect(canAny(SubsystemRole.STAFF, [Permission.PROJECT_READ_ANY])).toBe(true);
  });

  it('defines permissions for every subsystem role', () => {
    for (const role of Object.values(SubsystemRole)) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });
});
