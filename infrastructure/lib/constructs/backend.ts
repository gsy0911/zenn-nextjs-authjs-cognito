import {
  Duration,
  Stack,
  aws_iam,
  aws_certificatemanager as acm,
  aws_route53,
  aws_route53_targets,
  aws_lambda,
  aws_apigateway,
  aws_ecr,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { environment } from "./common";

export interface BackendProps {
  environment: environment;
  servicePrefix: string;
  ecr: {
    repositoryArn: `arn:aws:ecr:ap-northeast-1:${string}:repository/${string}`;
  };
  apigw: {
    basePath: "v1";
    certificate: `arn:aws:acm:us-east-1:${string}:certificate/${string}`;
    route53DomainName: string;
    route53RecordName: string;
  };
  cognito: {
    userPoolId: `ap-northeast-${string}`;
    identityPoolId: `ap-northeast-1:${string}`;
  };
  s3Bucket: string;
}

export class Backend extends Construct {
  constructor(scope: Construct, id: string, props: BackendProps) {
    super(scope, id);
    const accountId = Stack.of(this).account;

    const { servicePrefix, environment } = props;
    /** */
    const role = new aws_iam.Role(this, "LambdaRole", {
      roleName: `${servicePrefix}-lambda-role-${environment}`,
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "lambdaRoleCwFullAccess",
          "arn:aws:iam::aws:policy/CloudWatchFullAccess",
        ),
        aws_iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "lambdaRoleCognitoPowerAccess",
          "arn:aws:iam::aws:policy/AmazonCognitoPowerUser",
        ),
      ],
    });
    const ecrRepositoryBackend = aws_ecr.Repository.fromRepositoryArn(this, "EcrRepository", props.ecr.repositoryArn);
    /**
     * container image
     * tag: params.environment
     */
    const lambdaEndpoint = new aws_lambda.DockerImageFunction(this, "LambdaHandler", {
      functionName: `${servicePrefix}-lambda-endpoint-${environment}`,
      code: aws_lambda.DockerImageCode.fromEcr(ecrRepositoryBackend, {
        tagOrDigest: "backend",
      }),
      timeout: Duration.seconds(30),
      memorySize: 1024,
      role,
      environment: {
        TZ: "Asia/Tokyo",
        ACCOUNT_ID: accountId,
        USER_POOL_ID: props.cognito.userPoolId,
        IDENTITY_POOL_ID: props.cognito.identityPoolId,
        S3_BUCKET: props.s3Bucket,
      },
    });

    // integrationの定義
    const integrationDefault = new aws_apigateway.LambdaIntegration(lambdaEndpoint);

    // API Gatewayの定義
    const api = new aws_apigateway.RestApi(this, "Api", {
      restApiName: `${servicePrefix}-apigw-endpoint`,
      defaultIntegration: integrationDefault,
      deployOptions: {
        stageName: props.apigw.basePath,
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
    const readFileRoot = api.root.addResource("read-file");
    readFileRoot.addMethod("GET", integrationDefault, {
      authorizationType: aws_apigateway.AuthorizationType.IAM,
    });

    // カスタムドメインの設定: apigwそのもののドメイン設定
    const apigwCustomDomainName = new aws_apigateway.DomainName(this, "CustomDomain", {
      certificate: acm.Certificate.fromCertificateArn(this, "certificate", props.apigw.certificate),
      domainName: props.apigw.route53RecordName,
      endpointType: aws_apigateway.EndpointType.EDGE,
      mapping: api,
      basePath: props.apigw.basePath,
    });
    // Route 53 for cloudfront
    const hostedZone = aws_route53.HostedZone.fromLookup(this, "ApigwHostedZone", {
      domainName: props.apigw.route53DomainName,
    });
    new aws_route53.ARecord(this, "ARecord", {
      zone: hostedZone,
      recordName: props.apigw.route53RecordName,
      target: aws_route53.RecordTarget.fromAlias(new aws_route53_targets.ApiGatewayDomain(apigwCustomDomainName)),
    });
  }
}
