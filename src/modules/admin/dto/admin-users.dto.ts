import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role, PlanTier } from '../../../common/constants/index.js';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Role, example: Role.ADMIN })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class AdminUserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user role', enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Search by email or name' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminUpdateSubscriptionDto {
  @ApiProperty({ enum: PlanTier, example: PlanTier.PREMIUM })
  @IsEnum(PlanTier)
  @IsNotEmpty()
  planTier: PlanTier;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  requestsLimitDaily?: number;
}
