import { AutoLogger } from "../../decorators/AutoLogger";

@AutoLogger
export class CustomError extends Error {
  statusCode: number;
  serverError?: unknown;

  constructor(message: string, statusCode: number, serverError?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.serverError = serverError;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
