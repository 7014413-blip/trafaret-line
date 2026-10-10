/**
 * Послідовна обробка подій одного користувача. Альбом із 10 фото приходить
 * десятьма окремими повідомленнями майже одночасно; без черги вони перетирали б
 * чернетку одне одного.
 */
export class UserLock {
  private readonly chains = new Map<number, Promise<unknown>>()

  run<T>(userId: number, task: () => Promise<T>): Promise<T> {
    const previous = this.chains.get(userId) ?? Promise.resolve()
    const next = previous.catch(() => undefined).then(task)
    this.chains.set(userId, next)
    void next
      .catch(() => undefined)
      .finally(() => {
        if (this.chains.get(userId) === next) this.chains.delete(userId)
      })
    return next
  }
}
