// src/utils/powertools.ts
import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";

const logger = new Logger({ serviceName: "MarketingService" });
const tracer = new Tracer({ serviceName: "MarketingService" });
const metrics = new Metrics({ namespace: "MarketingNamespace" });

export { logger, tracer, metrics };
