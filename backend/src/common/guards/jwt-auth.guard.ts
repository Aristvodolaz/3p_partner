import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface CurrentEmployeeInfo {
  id: number;
  employeeId: string;
  fullName: string;
  role: string | null;
}

interface JwtPayload {
  employeeId: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Требуется авторизация');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Недействительный или истёкший токен');
    }

    // Роль читаем из БД на каждый запрос, а не из токена — чтобы смена роли
    // администратором вступала в силу немедленно, без повторного логина.
    const employee = await this.prisma.employee.findUnique({
      where: { employeeId: payload.employeeId },
    });
    if (!employee || !employee.isActive) {
      throw new UnauthorizedException('Сотрудник не найден или деактивирован');
    }

    request.employee = {
      id: employee.id,
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      role: employee.role,
    } satisfies CurrentEmployeeInfo;

    return true;
  }
}
