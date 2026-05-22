import redis from '@/lib/redis'
import logger from '@/lib/logger'

export async function invalidateBrowseCache() {
  try {
    // Get all browse cache keys
    const keys = await redis.keys('books:browse:*')
    
    if (keys.length > 0) {
      await redis.del(keys)
      logger.info(`Invalidated ${keys.length} browse cache keys after book mutation`)
    }
  } catch (error) {
    logger.error('Failed to invalidate browse cache', { error })
    // Don't throw - cache invalidation shouldn't break the main operation
  }
}

// Optional: More targeted invalidation based on city/state
export async function invalidateBrowseCacheByLocation(city?: string, state?: string) {
  try {
    let pattern = 'books:browse:*'
    
    if (city) {
      pattern = `books:browse:city=${city}:*`
    }
    
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      await redis.del(keys)
      logger.info(`Invalidated ${keys.length} location-specific cache keys`)
    }
  } catch (error) {
    logger.error('Failed to invalidate location cache', { error })
  }
}