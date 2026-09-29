import { SetMetadata } from '@nestjs/common';
import { Role, ROLES_KEY } from '../constants/index.js';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
