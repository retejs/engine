import { expect, it } from '@jest/globals'

import { Cancelled, createCancellblePromise } from '../../src/utils/cancellable'

function createControlledPromise<T>() {
  let resolvePromise: ((value: T) => void) | null = null

  const promise = new Promise<T>(resolve => {
    resolvePromise = resolve
  })

  return [promise, async (value: T) => {
    if (!resolvePromise) throw new Error('Promise is not created')
    resolvePromise(value)
    await new Promise(resolve => process.nextTick(resolve))
  }] as const
}

describe('Cancellable', () => {
  it('executes sequence of callbacks', async () => {
    const promise = createCancellblePromise(
      () => 1,
      n => n + 1,
      n => n * 2
    )

    expect(promise).toBeInstanceOf(Promise)

    const result = await promise

    expect(result).toBe(4)
  })

  it('executes sequence of promises', async () => {
    const promise = createCancellblePromise(
      () => Promise.resolve(1),
      n => Promise.resolve(n + 1),
      n => Promise.resolve(n * 2)
    )

    expect(promise).toBeInstanceOf(Promise)

    const result = await promise

    expect(result).toBe(4)
  })

  it('handles nested promises correctly', async () => {
    const [promise1, resolvePromise1] = createControlledPromise<number>()
    const fn1 = jest.fn((x: number) => x + 1)
    const [promise2, resolvePromise2] = createControlledPromise<number>()
    const promise = createCancellblePromise(
      () => promise1,
      fn1,
      () => promise2
    )

    expect(fn1).not.toBeCalled()
    await resolvePromise1(1)
    expect(fn1).toBeCalled()
    await resolvePromise2(3)

    const result = await promise

    expect(result).toBe(3)
  })

  it('cancels promise', async () => {
    const [promise1, resolvePromise1] = createControlledPromise<number>()
    const fn1 = jest.fn((x: number) => x + 1)
    const [promise2, resolvePromise2] = createControlledPromise<number>()
    const promise = createCancellblePromise(
      () => promise1,
      fn1,
      () => promise2
    )

    expect(promise.cancel).toBeInstanceOf(Function)
    expect(fn1).not.toBeCalled()
    await resolvePromise1(1)
    expect(fn1).toBeCalled()
    promise.cancel!()
    await resolvePromise2(3)

    await expect(promise).rejects.toThrow(Cancelled)
  })
})
