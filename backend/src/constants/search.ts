export const SEARCH_MAX_RESULTS = 5;

export const SEARCH_DEPTH = 'basic' as const;

export const MOCK_SEARCH_URL = 'https://example.com/search';

export const SEARCH_RESULT_FALLBACK_TITLE = 'No Title';

export const MOCK_TAVILY_WARNING = '⚠️ TAVILY_API_KEY is not configured or is a mock key.';

export const UNKNOWN_SEARCH_ERROR = 'Unknown search error';

export const WEB_SEARCH_ERROR_PREFIX = 'WEB_SEARCH_ERROR:';

export const mockSearchTitle = (query: string): string => `Search results for "${query}"`;

export const mockSearchContent = (query: string): string =>
  `Simulated live search results for query: ${query}. To enable real search results, provide a valid TAVILY_API_KEY in the environment.`;

export const mockSearchFormatted = (query: string, title: string, url: string, content: string): string =>
  `Search results for: "${query}":\n\n1. ${title} (${url})\n${content}`;

export const emptySearchFormatted = (query: string): string =>
  `No web results found for query: "${query}".`;

export const failedSearchFormatted = (query: string, message: string): string =>
  `${WEB_SEARCH_ERROR_PREFIX} Search failed for "${query}": ${message}`;
