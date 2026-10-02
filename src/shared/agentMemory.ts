import { AgentMemory } from '@redis-iris/agent-memory';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const apiKey =
  env.REDIS_AGENT_MEMORY_API_KEY ||
  'mem1_Om-jmKyRMrFzQA-_EYbd5GostOzJl1IWpAWdqyIxVFpZ42QLB940H27XyIQMrtUCXJu25GOibCBwliOCwKs75gYtndmcIak6d6UinCD11vuYgEjsM34a_AqUorOwPysxZhfxJWmhvwXxNzFmSA==';

const serverURL = env.REDIS_AGENT_MEMORY_SERVER_URL || 'https://aws-us-east-1.memory.redis.io';
const storeId = env.REDIS_AGENT_MEMORY_STORE_ID || '2c867aacb7ae42d79946c4a09e6d4624';

export const agentMemory = new AgentMemory({
  serverURL,
  storeId,
  apiKey,
});

logger.info({ storeId, serverURL }, 'Redis Iris AgentMemory initialized');

export default agentMemory;
