import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @ApiProperty({
    example: 'NestJS clean architecture best practices',
    description: 'The search query string',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Maximum number of search results to return (1-20)',
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  maxResults?: number = 5;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether to generate an AI summary synthesis of search results',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeSummary?: boolean = true;
}

export class SearchSuggestionQueryDto {
  @ApiProperty({
    example: 'nest',
    description: 'Search prefix for autocomplete recommendations',
  })
  @IsString()
  @IsNotEmpty()
  q: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Max number of suggestions to return',
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 5;
}
