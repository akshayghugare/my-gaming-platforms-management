export class AppError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number = 500, data?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
