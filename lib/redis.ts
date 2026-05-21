import Redis from 'ioredis'
import logger from './logger'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: null,
})

redis.on('connect', () => {
  logger.info('Redis connected successfully')
})

redis.on('error', (error) => {
  logger.error('Redis connection error', { error: error.message })
})

redis.on('close', () => {
  logger.info('Redis connection closed')
})

export default redis