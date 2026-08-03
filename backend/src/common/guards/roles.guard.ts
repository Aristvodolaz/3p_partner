import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CurrentEmployeeInfo } from './jwt-auth.guard';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const employee: CurrentEmployeeInfo | undefined = request.employee;
    if (!employee || !employee.role || !requiredRoles.includes(employee.role)) {
      throw new ForbiddenException(
        `Недостаточно прав — требуется роль: ${requiredRoles.join(' или ')}`,
      );
    }
    return true;
  }
}
