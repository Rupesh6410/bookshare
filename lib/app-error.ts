// lib/app-error.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'AppError'
  }
}