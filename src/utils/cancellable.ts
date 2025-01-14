/**
 * Cancelled exception. Thrown when `reset` is called while fetching data.
 */
export class Cancelled extends Error {
  constructor() {
    super('cancelled')
  }
}

export type Cancellable<T> = Promise<T> & { cancel?: () => void }
type S<A, B> = (data: A) => B | PromiseLike<B>

function createCancellblePromise<A, B>(...sequence: [S<void, A>, S<A, B>]): Cancellable<B>
function createCancellblePromise<A, B, C>(...sequence: [S<void, A>, S<A, B>, S<B, C>]): Cancellable<C>
function createCancellblePromise(...sequence: S<any, any>[]): Cancellable<any> {
  let cancelled = false

  function commit<R>(value: R): R {
    if (cancelled) {
      throw new Cancelled()
    }
    return value
  }

  // eslint-disable-next-line init-declarations
  let reject: (reason?: any) => void

  const promise: Cancellable<void> = new Promise<void>((res, rej) => {
    reject = rej
    res()
  })

  const n = sequence.reduce((p, item) => {
    const t = p.then(item as any).then(commit)

    return t
  }, promise) as Cancellable<any>

  n.cancel = () => {
    if (!cancelled) reject(new Cancelled())
    cancelled = true
  }

  return n
}

export {
  createCancellblePromise
}
