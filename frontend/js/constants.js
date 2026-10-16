export const DEFAULT_CHAT_TITLE = 'New Chat';

export const WELCOME_CHAT_TITLE = 'Welcome to CodeChat';

export const CHAT_TITLE_MAX_LENGTH = 100;

export const USERNAME_MIN_LENGTH = 2;

export const USERNAME_MAX_LENGTH = 50;

export const PASSWORD_MIN_LENGTH = 8;

export const DEFAULT_CODE_LABEL = 'Code';

export const COPY_LABEL = 'Copy';

export const COPIED_LABEL = 'Copied';

export const TOAST = {
  signedOut: 'Signed out successfully',
  copyFailed: 'Could not copy code',
  loadChatsFailed: 'Failed to load conversations',
  loadMessagesFailed: 'Could not load chat history',
  networkError: 'Cannot reach the server. Check that the API is running and CORS is configured.',
  chatCreated: 'New conversation created',
  createChatFailed: 'Failed to create new chat',
  chatDeleted: 'Conversation deleted',
  deleteChatFailed: 'Failed to delete conversation',
  emptyChatName: 'Chat name cannot be empty',
  chatNameTooLong: `Chat name must be ${CHAT_TITLE_MAX_LENGTH} characters or fewer`,
  renameFailed: 'Failed to rename conversation',
  chatRenamed: 'Conversation renamed',
  assistantFailed: 'Error getting assistant response',
};

export const LANGUAGE_LABELS = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  zsh: 'Shell',
  console: 'Shell',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  md: 'Markdown',
  markdown: 'Markdown',
  sql: 'SQL',
  yaml: 'YAML',
  yml: 'YAML',
  go: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  csharp: 'C#',
  rb: 'Ruby',
  ruby: 'Ruby',
  php: 'PHP',
  xml: 'XML',
  toml: 'TOML',
  diff: 'Diff',
  text: 'Text',
  plaintext: 'Text',
  txt: 'Text',
  graphql: 'GraphQL',
  vue: 'Vue',
  kotlin: 'Kotlin',
  kt: 'Kotlin',
  swift: 'Swift',
};
