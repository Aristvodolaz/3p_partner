import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает роут как доступный без авторизации (например, /auth/login) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
