import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";

interface S3Props extends cdk.StackProps {
  projectName: string;
}

export class S3Construct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly bucketUrl: string;

  constructor(scope: Construct, id: string, props: S3Props) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, `${props.projectName}-email-images`, {
      bucketName: `${props.projectName}-email-template-images`,
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET],
          allowedHeaders: ["*"],
        },
      ],
    });

    // Agregar una política para permitir acceso público de lectura
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${this.bucket.bucketArn}/*`],
        principals: [new iam.AnyPrincipal()],
      })
    );

    // URL pública base para acceder a los archivos
    this.bucketUrl = `https://${this.bucket.bucketName}.s3.${cdk.Aws.REGION}.amazonaws.com`;

    // Desplegar los archivos de la carpeta "s3" al bucket
    new s3deploy.BucketDeployment(this, `${props.projectName}-deploy-images`, {
      sources: [s3deploy.Source.asset("lib/S3-construct/files")], // Carpeta local con las imágenes
      destinationBucket: this.bucket,
      retainOnDelete: false, // Si se borra el bucket, también se eliminan los archivos
    });

    // Outputs
    new cdk.CfnOutput(this, `${props.projectName}-bucket-name`, {
      value: this.bucket.bucketName,
    });

    new cdk.CfnOutput(this, `${props.projectName}-bucket-url`, {
      value: this.bucketUrl,
    });
  }
}
