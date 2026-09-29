import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AiProvidersService } from './ai-providers.service.js';
import { CreateProviderDto } from './dto/create-provider.dto.js';
import { UpdateProviderDto } from './dto/update-provider.dto.js';
import {
  ProviderResponseDto,
  ProviderHealthDto,
} from './dto/provider-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Role } from '../../common/constants/index.js';

@ApiTags('AI Providers')
@Controller('ai-providers')
export class AiProvidersController {
  constructor(private readonly aiProvidersService: AiProvidersService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List available AI providers and models',
    description:
      'Returns all enabled AI providers, default models, and available options for the Chrome extension dropdown.',
  })
  @ApiQuery({
    name: 'onlyEnabled',
    required: false,
    type: Boolean,
    description: 'Filter only enabled providers (default: true)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI providers retrieved successfully',
    type: [ProviderResponseDto],
  })
  async findAll(
    @Query('onlyEnabled') onlyEnabled?: string,
  ): Promise<ProviderResponseDto[]> {
    const isOnly = onlyEnabled !== 'false';
    return this.aiProvidersService.findAll(isOnly);
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Health check for all enabled AI providers',
    description:
      'Pings each AI provider endpoint and returns response latency and operational status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Providers health check results',
    type: [ProviderHealthDto],
  })
  async getHealthAll(): Promise<ProviderHealthDto[]> {
    return this.aiProvidersService.getHealthAll();
  }

  @Public()
  @Get(':id/health')
  @ApiOperation({
    summary: 'Health check for a specific AI provider',
    description: 'Pings the specified provider API endpoint.',
  })
  @ApiParam({ name: 'id', description: 'AI Provider UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Provider health check result',
    type: ProviderHealthDto,
  })
  async getHealthById(@Param('id') id: string): Promise<ProviderHealthDto> {
    return this.aiProvidersService.getHealthById(id);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get details of an AI provider',
    description: 'Retrieves provider configuration with masked API key.',
  })
  @ApiParam({ name: 'id', description: 'AI Provider UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Provider details retrieved',
    type: ProviderResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<ProviderResponseDto> {
    return this.aiProvidersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a new AI provider (Admin only)',
    description:
      'Creates a new AI provider configuration. The API key is stored securely using AES-256-GCM encryption.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'AI Provider created successfully',
    type: ProviderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async create(@Body() dto: CreateProviderDto): Promise<ProviderResponseDto> {
    return this.aiProvidersService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update an AI provider (Admin only)',
    description: 'Updates provider parameters, models, or credentials.',
  })
  @ApiParam({ name: 'id', description: 'AI Provider UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI Provider updated successfully',
    type: ProviderResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProviderDto,
  ): Promise<ProviderResponseDto> {
    return this.aiProvidersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'Enable/Disable an AI provider (Admin only)',
    description: 'Toggles provider active status.',
  })
  @ApiParam({ name: 'id', description: 'AI Provider UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Provider status toggled successfully',
    type: ProviderResponseDto,
  })
  async toggle(@Param('id') id: string): Promise<ProviderResponseDto> {
    return this.aiProvidersService.toggleEnabled(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id/set-default')
  @ApiOperation({
    summary: 'Set default AI provider (Admin only)',
    description:
      'Sets this provider as system default and unsets previous defaults.',
  })
  @ApiParam({ name: 'id', description: 'AI Provider UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Default provider updated',
    type: ProviderResponseDto,
  })
  async setDefault(@Param('id') id: string): Promise<ProviderResponseDto> {
    return this.aiProvidersService.setDefault(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an AI provider (Admin only)',
    description: 'Permanently removes an AI provider configuration.',
  })
  @ApiParam({ name: 'id', description: 'AI Provider UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI Provider deleted successfully',
  })
  async remove(@Param('id') id: string) {
    return this.aiProvidersService.remove(id);
  }
}
