import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PlanTier } from '../../../common/constants/index.js';

export class ChangePlanDto {
  @ApiProperty({
    enum: PlanTier,
    example: PlanTier.PREMIUM,
    description: 'Target subscription tier (FREE, PREMIUM, ENTERPRISE)',
  })
  @IsEnum(PlanTier)
  @IsNotEmpty()
  planTier: PlanTier;
}
