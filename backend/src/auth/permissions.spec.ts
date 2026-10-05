import { SubsystemRole } from './core-hub-identity';
import { Permission, ROLE_PERMISSIONS, can, canAny } from './permissions';

describe('SoftwareProjectRisk permission model', () => {
  it('student and alumni have no project-management permissions', () => {
    for (const permission of Object.values(Permission)) {
      expect(can(SubsystemRole.STUDENT, permission)).toBe(false);
      expect(can(SubsystemRole.ALUMNI, permission)).toBe(false);
    }
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
    expect(canAny(SubsystemRole.STUDENT, [Permission.PROJECT_READ_ANY])).toBe(false);
    expect(canAny(SubsystemRole.STAFF, [Permission.PROJECT_READ_ANY])).toBe(true);
  });

  it('defines permissions for every subsystem role', () => {
    for (const role of Object.values(SubsystemRole)) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });
});
