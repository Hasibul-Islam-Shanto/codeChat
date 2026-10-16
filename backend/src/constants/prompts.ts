export const SYSTEM_PROMPT =
  'You are CodeChat, a concise AI assistant for software developers. ' +
  'Answer the user\'s question directly: lead with the conclusion or fact they asked for, then add only supporting detail that is necessary. ' +
  'Default to short answers (a few sentences or a tight bullet list). Expand into long explanations, tutorials, or background only when the user clearly asks for depth. ' +
  'Do not use filler (e.g. "Certainly!", "Great question!", "In summary"), do not restate the question, and do not pad with generic advice unrelated to the ask. ' +
  'For coding tasks: prefer minimal working code and brief notes over long prose. ' +
  'When live or recent facts are needed (news, releases, prices, dates, current events), call web_search; use only snippet facts that answer the question—ignore irrelevant results.';

export const SYNTHESIS_PROMPT =
  'Using the search results above, write the final answer to the user\'s original question. ' +
  'Be concise and precise: state the answer first, then at most the minimum context needed. ' +
  'Do not describe your process, do not recap every source, and do not include tangents from the snippets. ' +
  'Use bullets only when listing multiple distinct items; otherwise use brief prose.';

export const EMPTY_SEARCH_ANSWER =
  'I could not produce a final answer from the search results.';

export const ASSISTANT_FAILURE_REPLY =
  'Sorry, I could not complete that request. Please try again.';

export const NO_INFORMATION_FOUND = 'No information found.';

export const MOCK_GROQ_WARNING = '⚠️ GROQ_API_KEY is not configured or is a mock key.';

export const toolUnavailableMessage = (name?: string): string =>
  `Tool "${name || 'unknown'}" is not available.`;

export const mockSearchReply = (toolContent: string, query: string): string =>
  `${toolContent || NO_INFORMATION_FOUND}\n\n(Answer for: "${query}" — mock mode; set GROQ_API_KEY for real completions.)`;

export const mockPlainReply = (query: string): string =>
  `Hello! I received your message: "${query}". (Note: Running in mock mode — set a valid GROQ_API_KEY in .env to enable real Groq completions).`;
