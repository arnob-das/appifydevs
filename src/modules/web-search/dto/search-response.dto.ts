import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchResultItemDto {
  @ApiProperty({ example: 'NestJS - A progressive Node.js framework' })
  title: string;

  @ApiProperty({ example: 'https://nestjs.com' })
  url: string;

  @ApiProperty({
    example:
      'NestJS is a framework for building efficient, scalable Node.js server-side applications.',
  })
  snippet: string;

  @ApiProperty({ example: 'nestjs.com' })
  domain: string;
}

export class WebSearchResponseDto {
  @ApiProperty({ example: 'NestJS clean architecture' })
  query: string;

  @ApiProperty({ type: [SearchResultItemDto] })
  results: SearchResultItemDto[];

  @ApiPropertyOptional({
    example:
      'Clean architecture in NestJS emphasizes separation of concerns across controllers, services, repositories, and domain entities.',
  })
  summary?: string | null;

  @ApiProperty({ example: false, description: 'True if fetched from cache' })
  cached: boolean;

  @ApiProperty({ example: 45, description: 'Response latency in milliseconds' })
  responseTimeMs: number;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  createdAt: Date;
}

export class SearchHistoryItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'NestJS clean architecture' })
  query: string;

  @ApiProperty({ example: 5 })
  resultCount: number;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  createdAt: Date;
}
