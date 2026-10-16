import dotenv from 'dotenv';
import { z } from 'zod';
import { JWT_SECRET_MIN_LENGTH } from '../constants/auth';
import { DEFAULT_GROQ_MODEL } from '../constants/llm';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(JWT_SECRET_MIN_LENGTH, `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters`),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  GROQ_API_KEY: z.string().default(''),
  GROQ_MODEL: z.string().default(DEFAULT_GROQ_MODEL),
  TAVILY_API_KEY: z.string().default(''),
  TRUST_PROXY: z
    .enum(['0', '1'])
    .default('0')
    .transform((val) => val === '1'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
