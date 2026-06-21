import { useState, useCallback } from 'react'
import { storageGet, storageSet } from '../utils/storage'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => storageGet<T>(key, initialValue))

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        storageSet(key, next)
        return next
      })
    },
    [key]
  )

  return [state, setValue]
}
