// src/decorators/AutoLogger.ts

import { CustomError } from "../utils/Error/customError";
import { logger } from "../utils/powertools";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function AutoLogger<T extends abstract new (...args: any[]) => any>(targetConstructor: T): T {
  const className = targetConstructor.name;

  for (const propertyName of Object.getOwnPropertyNames(targetConstructor.prototype)) {
    const descriptor = Object.getOwnPropertyDescriptor(targetConstructor.prototype, propertyName);

    if (propertyName !== "constructor" && descriptor && typeof descriptor.value === "function") {
      const originalMethod = descriptor.value as (...args: unknown[]) => unknown;

      targetConstructor.prototype[propertyName] = async function (...args: unknown[]) {
        const start = Date.now();
        logger.info("Entering method", {
          className,
          methodName: propertyName,
          arguments: args,
        });

        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - start;
          logger.info("Method completed successfully", {
            className,
            methodName: propertyName,
            durationMs: duration,
            result,
          });
          return result;
        } catch (error) {
          const duration = Date.now() - start;
          if (error instanceof CustomError) {
            logger.error("Method threw an error", {
              className,
              methodName: propertyName,
              durationMs: duration,
              errorMessage: error.message,
              errorCode: error.statusCode,
              errorName: error.name,
              errorStack: error.stack,
            });
          } else if (error instanceof Error) {
            logger.error("Method threw an error", {
              className,
              methodName: propertyName,
              durationMs: duration,
              errorMessage: error.message,
              errorStack: error.stack,
            });
          } else {
            logger.error("Method threw an unknown error", {
              className,
              methodName: propertyName,
              durationMs: duration,
              error,
            });
          }
          throw error;
        }
      };
    }
  }

  return targetConstructor;
}
