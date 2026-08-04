import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { GrantRoleDto } from './dto/grant-role.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { employeeId: { contains: search } },
            { fullName: { contains: search } },
          ],
        }
      : undefined;
    const data = await this.prisma.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return { data, total: data.length };
  }

  async update(id: number, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException(`Сотрудник #${id} не найден`);

    return this.prisma.employee.update({
      where: { id },
      data: {
        role: dto.role === undefined ? undefined : dto.role,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  /**
   * Назначает роль по ШК, даже если сотрудник ещё ни разу не входил в систему —
   * запись создаётся заранее, а ФИО подтянется при первом входе (auth.service
   * не трогает role при update, поэтому назначенная тут роль сохранится).
   */
  async grantRole(dto: GrantRoleDto) {
    return this.prisma.employee.upsert({
      where: { employeeId: dto.employeeId },
      update: { role: dto.role },
      create: {
        employeeId: dto.employeeId,
        fullName: '(ожидает первого входа)',
        role: dto.role,
      },
    });
  }
}
