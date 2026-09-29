import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator.js';

@ApiTags('Root')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({
    summary: 'API Root & System Status',
    description:
      'Returns API service status, version, and key endpoint references.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running and operational',
  })
  getRoot() {
    return {
      name: 'EchoGPT Backend REST API',
      version: '1.0.0',
      status: 'operational',
      documentation: '/api/docs',
      description:
        'Multi-AI Chat Sidebar REST API for EchoGPT Chrome Extension supporting OpenAI, Claude, and Gemini.',
      endpoints: {
        swaggerDocs: '/api/docs',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        subscriptions: '/api/v1/subscriptions',
        aiProviders: '/api/v1/ai-providers',
        chat: '/api/v1/chat',
        search: '/api/v1/search',
        admin: '/api/v1/admin',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
