import { WEB_SEARCH_TOOL_NAME } from '../constants/llm';

export const WEB_SEARCH_TOOL = {
  type: 'function' as const,
  function: {
    name: WEB_SEARCH_TOOL_NAME,
    description:
      'Search the live web for current events, facts, news, documentation, and up-to-date information.',
    parameters: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'The search query string to look up on the web',
        },
      },
      required: ['query'],
    },
  },
};
