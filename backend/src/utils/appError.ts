export class AppError extends Error {
  public statusCode: number;
  public expose: boolean;

  constructor(message: string, statusCode = 500, expose = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.expose = expose;
  }
}
