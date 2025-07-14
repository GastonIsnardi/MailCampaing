import type * as cdk from "aws-cdk-lib";
import * as ses from "aws-cdk-lib/aws-ses";
import type * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as snsSubscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface s3Props extends cdk.StackProps {
  projectName: string;
  envType: string;
}

export class SESConstruct extends Construct {
  public readonly configurationSet: ses.CfnConfigurationSet;
  public readonly sesTopic: sns.Topic;
  public readonly sesEventDestination: ses.CfnConfigurationSetEventDestination;
  constructor(scope: Construct, id: string, props: s3Props) {
    super(scope, id);

    // Crear un Configuration Set en SES antes de configurar EventDestination
    this.configurationSet = new ses.CfnConfigurationSet(this, `${props.projectName}-${props.envType.toLowerCase()}-ses-config`, {
      name: `${props.projectName}-${props.envType.toLowerCase()}-ses-config`,
    });

    // Crear un tema SNS para recibir eventos de SES
    this.sesTopic = new sns.Topic(this, `${props.projectName}-ses-topic`, {
      topicName: `${props.projectName}-ses-notifications`,
      displayName: `${props.projectName}-SES Notifications Topic`,
    });

    if (!this.configurationSet.name) {
      throw new Error("Configuration Set name is undefined");
    }

    // Configurar SES para enviar eventos al tema SNS (depende del Configuration Set)
    this.sesEventDestination = new ses.CfnConfigurationSetEventDestination(this, "SesEventDestination", {
      configurationSetName: this.configurationSet.name, // Asegurar que use el Configuration Set creado antes
      eventDestination: {
        enabled: true,
        matchingEventTypes: [
          ses.EmailSendingEvent.DELIVERY,
          ses.EmailSendingEvent.OPEN,
          ses.EmailSendingEvent.CLICK,
          ses.EmailSendingEvent.COMPLAINT,
          ses.EmailSendingEvent.REJECT,
          ses.EmailSendingEvent.DELIVERY_DELAY,
          ses.EmailSendingEvent.BOUNCE,
          ses.EmailSendingEvent.SUBSCRIPTION,
          ses.EmailSendingEvent.RENDERING_FAILURE,
        ],
        snsDestination: {
          topicArn: this.sesTopic.topicArn,
        },
      },
    });

    // Asegurar que la configuración de eventos de SES se cree después del Configuration Set
    this.sesEventDestination.node.addDependency(this.configurationSet);
  }
}
