import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

interface ExternalAuthResponse {
  success: boolean;
  value: { ID: number | string; FULL_NAME: string }[] | null;
  errorCode: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(employeeId: string) {
    const authUrl = process.env.EMPLOYEE_AUTH_URL ?? 'http://10.171.12.36:3005/auth';

    let response: ExternalAuthResponse;
    try {
      const res = await fetch(`${authUrl}?id=${encodeURIComponent(employeeId)}`);
      response = (await res.json()) as ExternalAuthResponse;
    } catch {
      throw new ServiceUnavailableException('Сервис авторизации сотрудников недоступен');
    }

    const match = response.value?.[0];
    if (!response.success || !match) {
      throw new UnauthorizedException('Сотрудник с таким ШК/табельным номером не найден');
    }

    const employee = await this.prisma.employee.upsert({
      where: { employeeId },
      update: { fullName: match.FULL_NAME, lastLogin: new Date() },
      create: { employeeId, fullName: match.FULL_NAME, lastLogin: new Date() },
    });

    if (!employee.isActive) {
      throw new UnauthorizedException('Сотрудник деактивирован');
    }

    const token = await this.jwtService.signAsync({ employeeId: employee.employeeId });

    return {
      token,
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        role: employee.role,
      },
    };
  }
}
