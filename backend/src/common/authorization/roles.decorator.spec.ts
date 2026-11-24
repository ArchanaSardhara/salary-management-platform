import { Reflector } from '@nestjs/core';
import { Role, isRole } from './role.enum';
import { ROLES_KEY, Roles } from './roles.decorator';

describe('@Roles decorator', () => {
  const reflector = new Reflector();

  @Roles(Role.ADMIN)
  class AdminController {
    list() {}

    @Roles(Role.HR_MANAGER, Role.ADMIN)
    shared() {}
  }

  it('stores a single role as metadata on a controller', () => {
    expect(reflector.get(ROLES_KEY, AdminController)).toEqual([Role.ADMIN]);
  });

  it('stores several roles, in order, on a route handler', () => {
    expect(
      reflector.get(ROLES_KEY, AdminController.prototype.shared),
    ).toEqual([Role.HR_MANAGER, Role.ADMIN]);
  });

  it('requires at least one role at compile time', () => {
    // @ts-expect-error -- an empty @Roles() must not type-check
    const build = () => Roles();

    expect(typeof build).toBe('function');
  });

  it('sets no metadata on handlers without the decorator', () => {
    expect(
      reflector.get(ROLES_KEY, AdminController.prototype.list),
    ).toBeUndefined();
  });
});

describe('isRole', () => {
  it.each([Role.HR_MANAGER, Role.ADMIN])('accepts %s', (value) => {
    expect(isRole(value)).toBe(true);
  });

  it.each(['hr_manager', 'SUPER_ADMIN', '', null, undefined, 1, {}])(
    'rejects %p',
    (value) => {
      expect(isRole(value)).toBe(false);
    },
  );
});
