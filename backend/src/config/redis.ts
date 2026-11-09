import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: Redis | null = null;

if (process.env.REDIS_HOST) {
  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redisClient.on('error', (error) => {
    console.error('❌ Redis error:', error.message);
  });
} else {
  console.log('⚠️ Redis not configured. Skipping Redis connection.');
}

export { redisClient };
