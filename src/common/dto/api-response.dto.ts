import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message?: string;

  data?: T;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  timestamp: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string | string[];

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;

  @ApiProperty({ example: '2026-09-25T00:00:00.000Z' })
  timestamp: string;
}
