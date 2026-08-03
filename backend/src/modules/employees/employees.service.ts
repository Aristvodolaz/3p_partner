import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

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
}
