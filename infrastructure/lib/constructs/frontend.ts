import {
  aws_certificatemanager as acm,
  aws_ecr,
  aws_iam,
  aws_lambda,
  aws_route53,
  aws_route53_targets,
  aws_apigatewayv2,
  aws_apigatewayv2_integrations,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { environment, IFrontendEnvironment } from "./common";

export interface FrontendProps {
  environment: environment;
  servicePrefix: string;
  ecr: {
    repositoryArn: `arn:aws:ecr:ap-northeast-1:${string}:repository/${string}`;
  };
  apigw: {
    route53DomainName: string;
    route53RecordName: `*.${string}`;
  };
  lambda: {
    environment: { [key: string]: string } & IFrontendEnvironment;
  };
}

export class Frontend extends Construct {
  constructor(scope: Construct, id: string, props: FrontendProps) {
    super(scope, id);

    const { servicePrefix, environment } = props;
    const ecrRepositoryFrontend = aws_ecr.Repository.fromRepositoryArn(this, "EcrRepository", props.ecr.repositoryArn);
    const role = new aws_iam.Role(this, "LambdaRole", {
      roleName: `${servicePrefix}-lambda-frontend-role-${environment}`,
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "lambdaRoleCwFullAccess",
          "arn:aws:iam::aws:policy/CloudWatchFullAccessV2",
        ),
        aws_iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "lambdaRoleCognitoPowerAccess",
          "arn:aws:iam::aws:policy/AmazonCognitoPowerUser",
        ),
      ],
    });

    // Next.js standaloneを動かすLambdaの定義
    const handler = new aws_lambda.DockerImageFunction(this, "Handler", {
      functionName: `${servicePrefix}-frontend-endpoint`,
      code: aws_lambda.DockerImageCode.fromEcr(ecrRepositoryFrontend),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      environment: props.lambda.environment,
      architecture: aws_lambda.Architecture.ARM_64,
      retryAttempts: 0,
      role,
    });

    // Route 53 for api-gw
    const hostedZone = aws_route53.HostedZone.fromLookup(this, "apigw-hosted-zone", {
      domainName: props.apigw.route53DomainName,
    });
    const certificate = new acm.Certificate(this, "certificate", {
      domainName: props.apigw.route53RecordName,
      certificateName: `${servicePrefix}-frontend-${props.environment}`,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // カスタムドメインの設定
    const apigwCustomDomainName = new aws_apigatewayv2.DomainName(this, "CustomDomain", {
      certificate,
      domainName: props.apigw.route53RecordName,
      endpointType: aws_apigatewayv2.EndpointType.REGIONAL,
    });
    new aws_route53.ARecord(this, "ARecord", {
      zone: hostedZone,
      recordName: props.apigw.route53RecordName,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.ApiGatewayv2DomainProperties(
          apigwCustomDomainName.regionalDomainName,
          apigwCustomDomainName.regionalHostedZoneId,
        ),
      ),
    });

    // Amazon API Gateway HTTP APIの定義
    new aws_apigatewayv2.HttpApi(this, "Api", {
      apiName: `${servicePrefix}-frontend`,
      defaultIntegration: new aws_apigatewayv2_integrations.HttpLambdaIntegration("Integration", handler),
      defaultDomainMapping: {
        domainName: apigwCustomDomainName,
      },
      disableExecuteApiEndpoint: true,
    });
  }
}
