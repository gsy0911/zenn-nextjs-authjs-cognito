import {
  aws_certificatemanager as acm,
  aws_ecr,
  aws_iam,
  aws_lambda,
  aws_route53,
  aws_route53_targets,
  Duration,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {
  DomainName,
  EndpointType,
  HttpApi,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { IFrontendEnvironment, prefix } from "./constants";

export interface IFrontendWildcardDomain {
  ecr: {
    repositoryArn: `arn:aws:ecr:ap-northeast-1:${string}:repository/${string}`;
  };
  apigw: {
    certificate: `arn:aws:acm:ap-northeast-1:${string}:certificate/${string}`;
    route53DomainName: string;
    route53RecordName: `*.${string}`;
  };
  lambda: {
    environment: { [key: string]: string } & IFrontendEnvironment;
  };
}

export class FrontendWildcardDomain extends Stack {
  constructor(
    scope: Construct,
    id: string,
    params: IFrontendWildcardDomain,
    props: StackProps,
  ) {
    super(scope, id, props);

    const ecrRepositoryFrontend = aws_ecr.Repository.fromRepositoryArn(
      this,
      "frontend",
      params.ecr.repositoryArn,
    );
    const role = new aws_iam.Role(this, "lambdaRole", {
      roleName: `${prefix}-lambda-frontend-role`,
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
      functionName: `${prefix}-frontend-endpoint`,
      code: aws_lambda.DockerImageCode.fromEcr(ecrRepositoryFrontend),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      environment: params.lambda.environment,
      architecture: aws_lambda.Architecture.ARM_64,
      retryAttempts: 0,
      role,
    });

    // カスタムドメインの設定
    const apigwCustomDomainName = new DomainName(this, "CustomDomain", {
      certificate: acm.Certificate.fromCertificateArn(
        this,
        "Certificate",
        params.apigw.certificate,
      ),
      domainName: params.apigw.route53RecordName,
      endpointType: EndpointType.REGIONAL,
    });
    // Route 53 for api-gw
    const hostedZone = aws_route53.HostedZone.fromLookup(
      this,
      "apigw-hosted-zone",
      {
        domainName: params.apigw.route53DomainName,
      },
    );
    new aws_route53.ARecord(this, "SampleARecord", {
      zone: hostedZone,
      recordName: params.apigw.route53RecordName,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.ApiGatewayv2DomainProperties(
          apigwCustomDomainName.regionalDomainName,
          apigwCustomDomainName.regionalHostedZoneId,
        ),
      ),
    });

    // Amazon API Gateway HTTP APIの定義
    new HttpApi(this, "Api", {
      apiName: `${prefix}-frontend`,
      defaultIntegration: new HttpLambdaIntegration("Integration", handler),
      defaultDomainMapping: {
        domainName: apigwCustomDomainName,
      },
      disableExecuteApiEndpoint: true,
    });
  }
}
