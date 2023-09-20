import {
  App,
  Duration,
  Stack,
  StackProps,
  aws_iam,
  aws_certificatemanager as acm,
  aws_route53,
  aws_route53_targets,
  aws_lambda,
  aws_apigateway,
  aws_ecr,
} from "aws-cdk-lib";
import { prefix } from "./constants";

export interface IBackend {
  name: string;
  ecr: {
    repositoryArn: `arn:aws:ecr:ap-northeast-1:${string}:repository/${string}`;
  };
  apigw: {
    basePath: "v1";
    certificate: `arn:aws:acm:us-east-1:${string}:certificate/${string}`;
    route53DomainName: string;
    route53RecordName: string;
  };
}

export class Backend extends Stack {
  constructor(scope: App, id: string, params: IBackend, props?: StackProps) {
    super(scope, id, props);

    /** */
    const role = new aws_iam.Role(this, "lambda-role", {
      roleName: `${prefix}-lambda-role`,
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "lambdaRoleCwFullAccess",
          "arn:aws:iam::aws:policy/CloudWatchFullAccess",
        ),
      ],
    });
    const ecrRepositoryBackend = aws_ecr.Repository.fromRepositoryArn(
      this,
      "backend",
      params.ecr.repositoryArn,
    );
    /**
     * container image
     * tag: params.environment
     */
    const lambdaEndpoint = new aws_lambda.DockerImageFunction(
      this,
      "lambdaHandler",
      {
        functionName: `${prefix}-lambda-endpoint`,
        code: aws_lambda.DockerImageCode.fromEcr(ecrRepositoryBackend, {
          tagOrDigest: "latest",
        }),
        timeout: Duration.seconds(30),
        memorySize: 2048,
        role,
        environment: {
          TZ: "Asia/Tokyo",
        },
      },
    );

    // integrationの定義
    const integrationDefault = new aws_apigateway.LambdaIntegration(
      lambdaEndpoint,
    );

    // API Gatewayの定義
    const api = new aws_apigateway.RestApi(this, "apis", {
      restApiName: `${prefix}-apigw-endpoint`,
      defaultIntegration: integrationDefault,
      deployOptions: {
        stageName: params.apigw.basePath,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ["*"],
        allowHeaders: ["*"],
        allowMethods: ["*"],
      },
      // defaultのエンドポイントの無効化
      disableExecuteApiEndpoint: true,
    });

    const adminRoot = api.root.addResource("admin");
    adminRoot.addMethod("GET", integrationDefault, {
      authorizationType: aws_apigateway.AuthorizationType.IAM,
    });
    const userRoot = api.root.addResource("user");
    userRoot.addMethod("GET", integrationDefault, {
      authorizationType: aws_apigateway.AuthorizationType.IAM,
    });

    // カスタムドメインの設定: apigwそのもののドメイン設定
    const apigwCustomDomainName = new aws_apigateway.DomainName(
      this,
      "CustomDomain",
      {
        certificate: acm.Certificate.fromCertificateArn(
          this,
          "certificate",
          params.apigw.certificate,
        ),
        domainName: params.apigw.route53RecordName,
        endpointType: aws_apigateway.EndpointType.EDGE,
        mapping: api,
        basePath: params.apigw.basePath,
      },
    );
    // Route 53 for cloudfront
    const hostedZone = aws_route53.HostedZone.fromLookup(
      this,
      "apigw-hosted-zone",
      {
        domainName: params.apigw.route53DomainName,
      },
    );
    new aws_route53.ARecord(this, "a-record", {
      zone: hostedZone,
      recordName: params.apigw.route53RecordName,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.ApiGatewayDomain(apigwCustomDomainName),
      ),
    });
  }
}
