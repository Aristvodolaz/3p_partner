import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentEmployeeInfo } from '../guards/jwt-auth.guard';

/** Текущий авторизованный сотрудник, положенный в request гвардом JwtAuthGuard */
export const CurrentEmployee = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentEmployeeInfo => {
    const request = ctx.switchToHttp().getRequest();
    return request.employee;
  },
);
