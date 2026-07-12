export class UnregisteredJobException extends Error {
  constructor(jobType: string) {
    super(`No handler registered for ${jobType} — refusing to enqueue`)
  }
}