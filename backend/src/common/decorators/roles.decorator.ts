import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Ограничивает роут одной или несколькими ролями сотрудника (НПП/НРП) */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
