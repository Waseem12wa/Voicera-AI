import { useState, useEffect, useCallback } from 'react'
import { generateRandomData, DataGeneratorService } from '../services/dataGeneratorService'

export interface UseDataGeneratorOptions {
  refreshInterval?: number
  autoRefresh?: boolean
  cacheKey?: string
}

export const useDataGenerator = <T>(
  dataType: 'users' | 'courses' | 'analytics' | 'notifications' | 'system' | 'insights' | 'statistics',
  options: UseDataGeneratorOptions = {}
) => {
  const {
    refreshInterval = 30000,
    autoRefresh = true,
    cacheKey
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      let newData: T
      
      switch (dataType) {
        case 'users':
          newData = generateRandomData.users() as T
          break
        case 'courses':
          newData = generateRandomData.courses() as T
          break
        case 'analytics':
          newData = generateRandomData.analytics() as T
          break
        case 'notifications':
          newData = generateRandomData.notifications() as T
          break
        case 'system':
          newData = generateRandomData.systemMetrics() as T
          break
        case 'insights':
          newData = generateRandomData.insights() as T
          break
        case 'statistics':
          newData = generateRandomData.statistics() as T
          break
        default:
          throw new Error(`Unknown data type: ${dataType}`)
      }
      
      setData(newData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [dataType])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  const clearCache = useCallback(() => {
    const dataGenerator = DataGeneratorService.getInstance()
    if (cacheKey) {
      dataGenerator.cache.delete(cacheKey)
    } else {
      dataGenerator.clearCache()
    }
    fetchData()
  }, [cacheKey, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return

    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchData])

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    clearCache,
    isCached: cacheKey ? DataGeneratorService.getInstance().isCached(cacheKey) : false
  }
}

// Specific hooks for different data types
export const useUsers = (count?: number, options?: UseDataGeneratorOptions) => {
  return useDataGenerator('users', { ...options, cacheKey: count ? `users_${count}` : 'users' })
}

export const useCourses = (count?: number, options?: UseDataGeneratorOptions) => {
  return useDataGenerator('courses', { ...options, cacheKey: count ? `courses_${count}` : 'courses' })
}

export const useAnalytics = (options?: UseDataGeneratorOptions) => {
  return useDataGenerator('analytics', { ...options, cacheKey: 'analytics' })
}

export const useNotifications = (count?: number, options?: UseDataGeneratorOptions) => {
  return useDataGenerator('notifications', { ...options, cacheKey: count ? `notifications_${count}` : 'notifications' })
}

export const useSystemMetrics = (options?: UseDataGeneratorOptions) => {
  return useDataGenerator('system', { ...options, cacheKey: 'system_metrics' })
}

export const useInsights = (options?: UseDataGeneratorOptions) => {
  return useDataGenerator('insights', { ...options, cacheKey: 'insights' })
}

export const useStatistics = (options?: UseDataGeneratorOptions) => {
  return useDataGenerator('statistics', { ...options, cacheKey: 'statistics' })
}

// Utility hook for multiple data types
export const useMultipleData = (dataTypes: Array<keyof typeof generateRandomData>) => {
  const [data, setData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const results: Record<string, any> = {}
      
      for (const dataType of dataTypes) {
        switch (dataType) {
          case 'users':
            results.users = generateRandomData.users()
            break
          case 'courses':
            results.courses = generateRandomData.courses()
            break
          case 'analytics':
            results.analytics = generateRandomData.analytics()
            break
          case 'notifications':
            results.notifications = generateRandomData.notifications()
            break
          case 'systemMetrics':
            results.systemMetrics = generateRandomData.systemMetrics()
            break
          case 'insights':
            results.insights = generateRandomData.insights()
            break
          case 'statistics':
            results.statistics = generateRandomData.statistics()
            break
        }
      }
      
      setData(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      console.error('Error fetching multiple data:', err)
    } finally {
      setLoading(false)
    }
  }, [dataTypes])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  return {
    data,
    loading,
    error,
    refresh: fetchAllData
  }
}
