import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { logger } from "/opt/db/utils/powertools";
import { captureAWSv3Client } from "aws-xray-sdk-core";

export const ejecutarLambda = async (lambdaName: string, payload: any) => {
  logger.info("Ejecutando lambda", { lambdaName, payload });
  try {
    const lambdaClient = captureAWSv3Client(new LambdaClient({ region: "us-east-1" }));
    const command = new InvokeCommand({
      FunctionName: lambdaName,
      Payload: JSON.stringify(payload),
    });
    const response = await lambdaClient.send(command);
    logger.info("Lambda ejecutada", { response });
    return response;
  } catch (error) {
    logger.error("Error al ejecutar la lambda:", { error });
    throw error;
  }
};
