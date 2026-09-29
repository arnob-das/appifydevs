import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { WebSearchService } from './web-search.service.js';
import {
  SearchQueryDto,
  SearchSuggestionQueryDto,
} from './dto/search-query.dto.js';
import {
  WebSearchResponseDto,
} from './dto/search-response.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UsageLimitGuard } from '../../common/guards/usage-limit.guard.js';
import { Public } from '../../common/decorators/public.decorator.js';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator.js';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

@ApiTags('Web Search')
@Controller('search')
export class WebSearchController {
  constructor(private readonly webSearchService: WebSearchService) {}

  @UseGuards(JwtAuthGuard, UsageLimitGuard)
  @ApiBearerAuth('JWT-auth')
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Perform AI-assisted web search with caching (Bonus)',
    description:
      'Queries the web, leverages SearchCache for high-speed repeated queries, generates AI synthesis, and stores user search history.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results returned',
    type: WebSearchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.TOO_MANY_REQUESTS,
    description: 'Daily usage quota reached',
  })
  async search(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SearchQueryDto,
  ): Promise<WebSearchResponseDto> {
    return this.webSearchService.search(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, UsageLimitGuard)
  @ApiBearerAuth('JWT-auth')
  @Get()
  @ApiOperation({
    summary: 'Search query via GET',
    description: 'Convenience GET endpoint for web search.',
  })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'maxResults', required: false, type: Number })
  @ApiQuery({ name: 'includeSummary', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results returned',
    type: WebSearchResponseDto,
  })
  async searchGet(
    @CurrentUser() user: CurrentUserPayload,
    @Query('query') query: string,
    @Query('maxResults') maxResults?: number,
    @Query('includeSummary') includeSummary?: boolean,
  ): Promise<WebSearchResponseDto> {
    return this.webSearchService.search(user.userId, {
      query,
      maxResults: maxResults ? Number(maxResults) : 5,
      includeSummary: includeSummary !== false,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('history')
  @ApiOperation({
    summary: 'Get user search history',
    description: 'Retrieves paginated past searches for the logged-in user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search history list',
  })
  async getHistory(
    @CurrentUser() user: CurrentUserPayload,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.webSearchService.getHistory(
      user.userId,
      pagination.page,
      pagination.limit,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('recent')
  @ApiOperation({
    summary: 'Get recent unique search queries',
    description:
      'Returns array of recent distinct search queries for quick suggestion chips.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent searches list',
    type: [String],
  })
  async getRecent(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
  ): Promise<string[]> {
    return this.webSearchService.getRecentSearches(
      user.userId,
      limit ? Number(limit) : 10,
    );
  }

  @Public()
  @Get('suggestions')
  @ApiOperation({
    summary: 'Get search autocomplete suggestions',
    description:
      'Returns matching autocomplete suggestions based on user query prefix.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suggestions array',
    type: [String],
  })
  async getSuggestions(
    @Query() queryDto: SearchSuggestionQueryDto,
  ): Promise<string[]> {
    return this.webSearchService.getSuggestions(
      queryDto.q,
      queryDto.limit || 5,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear search history',
    description: 'Deletes all web search records for the current user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'History cleared',
  })
  async clearHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.webSearchService.clearHistory(user.userId);
  }
}
