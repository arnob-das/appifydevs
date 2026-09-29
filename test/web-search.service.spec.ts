import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSearchService } from '../src/modules/web-search/web-search.service.js';

describe('WebSearchService & SearchCache', () => {
  let service: WebSearchService;
  let mockPrisma: any;
  let mockSubService: any;

  beforeEach(() => {
    mockPrisma = {
      searchCache: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      webSearch: {
        create: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        deleteMany: vi.fn(),
      },
    };
    mockSubService = {
      incrementUsage: vi.fn().mockResolvedValue(undefined),
    };

    service = new WebSearchService(mockPrisma as any, mockSubService as any);
  });

  it('should return cached result when cache entry exists and is not expired (Cache Hit)', async () => {
    const cachedEntry = {
      id: 'cache-1',
      query: 'nestjs clean architecture',
      results: [
        {
          title: 'Cached Title',
          url: 'https://nestjs.com',
          snippet: 'Cached snippet',
          domain: 'nestjs.com',
        },
      ],
      summary: 'Cached summary',
      expiresAt: new Date(Date.now() + 3600000),
    };

    mockPrisma.searchCache.findUnique.mockResolvedValue(cachedEntry);
    mockPrisma.webSearch.create.mockResolvedValue({});

    const response = await service.search('user-1', {
      query: 'nestjs clean architecture',
    });

    expect(response.cached).toBe(true);
    expect(response.results).toHaveLength(1);
    expect(response.summary).toBe('Cached summary');
    expect(mockSubService.incrementUsage).toHaveBeenCalledWith('user-1', 50);
  });

  it('should perform search and save to cache on Cache Miss', async () => {
    mockPrisma.searchCache.findUnique.mockResolvedValue(null);
    mockPrisma.searchCache.upsert.mockResolvedValue({});
    mockPrisma.webSearch.create.mockResolvedValue({});

    const response = await service.search('user-1', {
      query: 'TypeScript Generics Tutorial',
      includeSummary: true,
      maxResults: 3,
    });

    expect(response.cached).toBe(false);
    expect(response.results.length).toBeGreaterThan(0);
    expect(response.summary).toBeDefined();
    expect(mockPrisma.searchCache.upsert).toHaveBeenCalled();
    expect(mockSubService.incrementUsage).toHaveBeenCalledWith('user-1', 150);
  });

  it('should return matching search suggestions based on query prefix', async () => {
    mockPrisma.webSearch.findMany.mockResolvedValue([
      { query: 'nestjs guards tutorial' },
    ]);

    const suggestions = await service.getSuggestions('nest', 5);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain('nestjs guards tutorial');
    expect(suggestions.some((s) => s.includes('nestjs'))).toBe(true);
  });
});
