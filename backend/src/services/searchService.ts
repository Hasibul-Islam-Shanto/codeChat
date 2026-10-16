import { tavily } from '@tavily/core';
import { env } from '../config/env';
import { MOCK_KEY_PREFIX } from '../constants/llm';
import {
  MOCK_SEARCH_URL,
  MOCK_TAVILY_WARNING,
  SEARCH_DEPTH,
  SEARCH_MAX_RESULTS,
  SEARCH_RESULT_FALLBACK_TITLE,
  UNKNOWN_SEARCH_ERROR,
  emptySearchFormatted,
  failedSearchFormatted,
  mockSearchContent,
  mockSearchFormatted,
  mockSearchTitle,
} from '../constants/search';

export interface SearchResultItem {
  title: string;
  url: string;
  content: string;
}

export interface SearchResult {
  ok: boolean;
  query: string;
  results: SearchResultItem[];
  formatted: string;
  error?: string;
}

const hasTavilyKey = Boolean(env.TAVILY_API_KEY) && !env.TAVILY_API_KEY.startsWith(MOCK_KEY_PREFIX);

const tvly = hasTavilyKey ? tavily({ apiKey: env.TAVILY_API_KEY }) : null;

export const searchWeb = async (query: string): Promise<SearchResult> => {
  if (!tvly) {
    console.warn(MOCK_TAVILY_WARNING);
    const mockResults: SearchResultItem[] = [
      {
        title: mockSearchTitle(query),
        url: MOCK_SEARCH_URL,
        content: mockSearchContent(query),
      },
    ];
    return {
      ok: true,
      query,
      results: mockResults,
      formatted: mockSearchFormatted(query, mockResults[0].title, mockResults[0].url, mockResults[0].content),
    };
  }

  try {
    const response = await tvly.search(query, {
      includeAnswer: false,
      maxResults: SEARCH_MAX_RESULTS,
      searchDepth: SEARCH_DEPTH,
    });

    const results: SearchResultItem[] = (response.results || []).map((item) => ({
      title: item.title || SEARCH_RESULT_FALLBACK_TITLE,
      url: item.url || '',
      content: item.content || '',
    }));

    if (results.length === 0) {
      return {
        ok: true,
        query,
        results: [],
        formatted: emptySearchFormatted(query),
      };
    }

    const formatted = results
      .map((r, i) => `${i + 1}. [${r.title}](${r.url})\n${r.content}`)
      .join('\n\n');

    return {
      ok: true,
      query,
      results,
      formatted,
    };
  } catch (error: any) {
    console.error('Error during Tavily web search:', error);
    const errorMessage = error.message || UNKNOWN_SEARCH_ERROR;
    return {
      ok: false,
      query,
      results: [],
      formatted: failedSearchFormatted(query, errorMessage),
      error: errorMessage,
    };
  }
};
