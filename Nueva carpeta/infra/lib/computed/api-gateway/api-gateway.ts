import * as cdk from "aws-cdk-lib";
import { ApiKey, ApiKeySourceType, LambdaIntegration, RestApi, UsagePlan } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { LambdaAPI } from "../lambda";

interface ApiGatewayProps {
  lambdas: cdk.aws_lambda.Function[];
  projectName: string;
  envType: string;
}

export class ApiGateway extends Construct {
  public readonly api: RestApi;
  private readonly apiKeyRequired: boolean = true;
  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);
    this.api = this.createApi(props.projectName, props.envType);
    const plan = this.createUsagePlan(props.projectName, props.envType);
    const key = this.createApiKey(plan, props.projectName, props.envType);
    this.createEndpoint(props.lambdas);
  }

  private createApi(projectName: string, envType: string): RestApi {
    return new RestApi(this, `${projectName}-${envType}-api`, {
      restApiName: `${projectName}-${envType}-api`,
      description: "API Gateway para manejar las solicitudes de enviar correos y obtener información.",
      apiKeySourceType: ApiKeySourceType.HEADER,
      deployOptions: {
        stageName: "v1",
      },
    });
  }
  private createApiKey(plan: UsagePlan, projectName: string, envType: string) {
    const key = this.api.addApiKey(`${projectName}-${envType}-api-key`);
    plan.addApiKey(key);
    return key;
  }
  private createUsagePlan(projectName: string, envType: string): UsagePlan {
    return this.api.addUsagePlan("UsagePlan", {
      name: `${projectName}-${envType}-usage-plan`,
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
    });
  }
  private createEndpoint(endpoints: LambdaAPI[]) {
    for (const lambda of endpoints) {
      if (lambda.apiPath && lambda.method) {
        const resource = this.api.root.addResource(lambda.apiPath);
        const integration = new LambdaIntegration(lambda);
        resource.addMethod(lambda.method, integration, {
          apiKeyRequired: this.apiKeyRequired,
        });
      }
    }
  }
}
