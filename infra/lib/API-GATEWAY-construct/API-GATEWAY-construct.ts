import { Construct } from "constructs";
import { RestApi, LambdaIntegration, ApiKeySourceType, type MethodOptions, type UsagePlan } from "aws-cdk-lib/aws-apigateway";
import type * as cdk from "aws-cdk-lib";
import type * as lambda from "aws-cdk-lib/aws-lambda";

interface ApiGatewayProps extends cdk.StackProps {
  projectName: string;
  enviarMailsLambda: lambda.Function;
  getInfoLambda: lambda.Function;
  getAllByFechaLambda: lambda.Function;
  getAllByEstadoLambda: lambda.Function;
  getByEstadoLambda: lambda.Function;
  getByFechaLambda: lambda.Function;
  getAllByEmailLambda: lambda.Function;
  getByEmailLambda: lambda.Function;
}

interface EndpointConfig {
  path: string;
  method: string;
  integration: LambdaIntegration;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: RestApi;
  private readonly apiKeyRequired: MethodOptions = { apiKeyRequired: true };

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.api = this.createApi(props.projectName);
    const plan = this.createUsagePlan(props.projectName);
    const key = this.createApiKey(plan);

    const endpoints: EndpointConfig[] = [
      { path: "enviar-mails", method: "POST", integration: new LambdaIntegration(props.enviarMailsLambda) },
      { path: "get-info", method: "GET", integration: new LambdaIntegration(props.getInfoLambda) },
      { path: "getAllByFecha", method: "GET", integration: new LambdaIntegration(props.getAllByFechaLambda) },
      { path: "getAllByEstado", method: "GET", integration: new LambdaIntegration(props.getAllByEstadoLambda) },
      { path: "getByEstado", method: "GET", integration: new LambdaIntegration(props.getByEstadoLambda) },
      { path: "getByFecha", method: "GET", integration: new LambdaIntegration(props.getByFechaLambda) },
      { path: "getAllByEmail", method: "GET", integration: new LambdaIntegration(props.getAllByEmailLambda) },
      { path: "getByEmail", method: "GET", integration: new LambdaIntegration(props.getByEmailLambda) },
    ];

    this.createEndpoints(endpoints);
  }

  private createApi(projectName: string): RestApi {
    return new RestApi(this, `${projectName}-api`, {
      restApiName: `${projectName}-api`,
      description: "API Gateway para manejar las solicitudes de enviar correos y obtener información.",
      apiKeySourceType: ApiKeySourceType.HEADER,
    });
  }

  private createUsagePlan(projectName: string): UsagePlan {
    return this.api.addUsagePlan("UsagePlan", {
      name: `${projectName}-usage-plan`,
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

  private createApiKey(plan: UsagePlan) {
    const key = this.api.addApiKey("ApiKey");
    plan.addApiKey(key);
    return key;
  }

  private createEndpoints(endpoints: EndpointConfig[]) {
    for (const { path, method, integration } of endpoints) {
      const resource = this.api.root.addResource(path);
      resource.addMethod(method, integration, this.apiKeyRequired);
    }
  }
}
