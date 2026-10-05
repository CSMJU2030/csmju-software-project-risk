import { SubsystemRole } from './core-hub-identity';

/**
 * Subsystem permissions (spec §16).
 *
 *   Core JWT -> Core Role -> Subsystem Role -> Permission -> Business Operation
 *
 * Business code asks for a permission, never for `role === 'admin'`.
 * `:own` variants are scope hints: the guard lets the request through and the
 * service performs the ownership check against business data.
 */
export enum Permission {
  PROJECT_READ_ANY = 'project:read:any',
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE_ANY = 'project:update:any',
  PROJECT_DELETE_ANY = 'project:delete:any',
}

/** Students do not manage project risk records in this subsystem. */
const STUDENT_PERMISSIONS: Permission[] = [];

/** Alumni do not manage project risk records in this subsystem. */
const ALUMNI_PERMISSIONS: Permission[] = [];

/** Staff manage project risk records. */
const STAFF_PERMISSIONS: Permission[] = Object.values(Permission);

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<Record<SubsystemRole, readonly Permission[]>> =
  Object.freeze({
    [SubsystemRole.STUDENT]: Object.freeze(STUDENT_PERMISSIONS),
    [SubsystemRole.ALUMNI]: Object.freeze(ALUMNI_PERMISSIONS),
    [SubsystemRole.STAFF]: Object.freeze(STAFF_PERMISSIONS),
    [SubsystemRole.ADMIN]: Object.freeze(ADMIN_PERMISSIONS),
  });

/** Does this subsystem role hold the given permission? */
export function can(role: SubsystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Does this subsystem role hold at least one of the given permissions? */
export function canAny(role: SubsystemRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}
