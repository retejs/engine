import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { Cache } from '../../src/utils/cache'

describe('Cache', () => {
  let cache: Cache<string, number>

  beforeEach(() => {
    cache = new Cache<string, number>()
  })

  it('adds and gets item from cache', () => {
    cache.add('key1', 1)
    expect(cache.get('key1')).toBe(1)
  })

  it('throws error when adding duplicate key', () => {
    cache.add('key1', 1)
    expect(() => cache.add('key1', 2)).toThrow('cache already exists')
  })

  it('patches existing item in cache', () => {
    cache.add('key1', 1)
    cache.patch('key1', 2)
    expect(cache.get('key1')).toBe(2)
  })

  it('deletes item from cache', () => {
    cache.add('key1', 1)
    cache.delete('key1')
    expect(cache.get('key1')).toBeUndefined()
  })

  it('calls onDelete callback when item is deleted', () => {
    const onDelete = jest.fn()

    cache = new Cache<string, number>(onDelete)
    cache.add('key1', 1)
    cache.delete('key1')
    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('clears all items from cache', () => {
    cache.add('key1', 1)
    cache.add('key2', 2)
    cache.clear()
    expect(cache.get('key1')).toBeUndefined()
    expect(cache.get('key2')).toBeUndefined()
  })
})
