import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from './authenticated-user.interface';
import { Role } from './role.enum';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

class UnprotectedController {
  handler() {}
}

@Roles(Role.HR_MANAGER)
class HrController {
  handler() {}

  @Roles(Role.ADMIN)
  adminOverride() {}
}

@Roles(Role.ADMIN)
class AdminController {
  handler() {}
}

function contextFor(
  controller: new () => object,
  handlerName: string,
  user?: AuthenticatedUser | null,
): ExecutionContext {
  const handler = (controller.prototype as Record<string, () => void>)[
    handlerName
  ];
  return {
    getHandler: () => handler,
    getClass: () => controller,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  const hrManager: AuthenticatedUser = {
    id: 'u-hr',
    role: Role.HR_MANAGER,
    isActive: true,
  };
  const admin: AuthenticatedUser = {
    id: 'u-admin',
    role: Role.ADMIN,
    isActive: true,
  };

  describe('routes without @Roles', () => {
    it('allows the request, even without a user', () => {
      expect(
        guard.canActivate(contextFor(UnprotectedController, 'handler')),
      ).toBe(true);
    });
  });

  describe('authentication', () => {
    it.each([undefined, null])(
      'throws 401 when request.user is %p',
      (user) => {
        expect(() =>
          guard.canActivate(contextFor(HrController, 'handler', user)),
        ).toThrow(UnauthorizedException);
      },
    );
  });

  describe('role checks', () => {
    it('allows a user whose role is listed', () => {
      expect(
        guard.canActivate(contextFor(HrController, 'handler', hrManager)),
      ).toBe(true);
      expect(
        guard.canActivate(contextFor(AdminController, 'handler', admin)),
      ).toBe(true);
    });

    it('forbids ADMIN from HR_MANAGER routes', () => {
      expect(() =>
        guard.canActivate(contextFor(HrController, 'handler', admin)),
      ).toThrow(ForbiddenException);
    });

    it('forbids HR_MANAGER from ADMIN routes', () => {
      expect(() =>
        guard.canActivate(contextFor(AdminController, 'handler', hrManager)),
      ).toThrow(ForbiddenException);
    });

    it('lets a handler-level @Roles override the controller-level one', () => {
      expect(
        guard.canActivate(contextFor(HrController, 'adminOverride', admin)),
      ).toBe(true);
      expect(() =>
        guard.canActivate(
          contextFor(HrController, 'adminOverride', hrManager),
        ),
      ).toThrow(ForbiddenException);
    });

    it('forbids a user with no role', () => {
      expect(() =>
        guard.canActivate(
          contextFor(HrController, 'handler', { id: 'u', isActive: true }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('forbids a user with an unknown role value', () => {
      const user = {
        id: 'u',
        isActive: true,
        role: 'SUPER_ADMIN',
      } as unknown as AuthenticatedUser;

      expect(() =>
        guard.canActivate(contextFor(HrController, 'handler', user)),
      ).toThrow(ForbiddenException);
    });
  });

  describe('deactivated users', () => {
    it('forbids a deactivated user even when the role matches', () => {
      expect(() =>
        guard.canActivate(
          contextFor(HrController, 'handler', {
            ...hrManager,
            isActive: false,
          }),
        ),
      ).toThrow(new ForbiddenException('Account is deactivated'));
    });

    it('forbids a user whose active status is not provided', () => {
      expect(() =>
        guard.canActivate(
          contextFor(HrController, 'handler', {
            id: 'u',
            role: Role.HR_MANAGER,
          }),
        ),
      ).toThrow(ForbiddenException);
    });

    it('does not block deactivated users on unprotected routes', () => {
      expect(
        guard.canActivate(
          contextFor(UnprotectedController, 'handler', {
            ...hrManager,
            isActive: false,
          }),
        ),
      ).toBe(true);
    });
  });
});
