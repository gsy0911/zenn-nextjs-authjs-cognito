import {
  aws_certificatemanager as acm,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_ecr,
  aws_iam,
  aws_lambda,
  aws_route53,
  aws_route53_targets,
  aws_s3,
  aws_ssm,
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
import {
  IFrontendEnvironment,
  prefix,
  ssmParameterEdgeName,
} from "./constants";

export interface IFrontend {
  ecr: {
    repositoryArn: `arn:aws:ecr:ap-northeast-1:${string}:repository/${string}`;
  };
  apigw: {
    certificate: `arn:aws:acm:ap-northeast-1:${string}:certificate/${string}`;
    route53DomainName: string;
    route53RecordName: string;
  };
  lambda: {
    environment: { [key: string]: string } & IFrontendEnvironment;
  };
  s3: {
    bucketName: string;
  };
  cloudfront: {
    certificate: `arn:aws:acm:us-east-1:${string}:certificate/${string}`;
    route53DomainName: string;
    route53RecordName: string;
    cachePolicyIdForApigw: `${string}-${string}-${string}-${string}-${string}`;
  };
}

export class Frontend extends Stack {
  constructor(
    scope: Construct,
    id: string,
    params: IFrontend,
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

    const s3Bucket = aws_s3.Bucket.fromBucketName(
      this,
      "sourceS3",
      params.s3.bucketName,
    );

    const s3Origin = new aws_cloudfront_origins.S3Origin(s3Bucket);
    const nextCompatibilitySsm = ssmParameterEdgeName({
      cfType: "origin-request",
      id: "nextCompatibility",
    });
    const nextCompatibilityParam =
      aws_ssm.StringParameter.fromStringParameterAttributes(
        this,
        "nextCompatibilitySsmParam",
        {
          parameterName: nextCompatibilitySsm,
        },
      ).stringValue;
    const nextCompatibilityVersion = aws_lambda.Version.fromVersionArn(
      this,
      "nextCompatibilityVersion",
      nextCompatibilityParam,
    );

    const distribution = new aws_cloudfront.Distribution(
      this,
      "frontend-distribution",
      {
        defaultBehavior: {
          origin: s3Origin,
          edgeLambdas: [
            {
              functionVersion: nextCompatibilityVersion,
              eventType: aws_cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
            },
          ],
          viewerProtocolPolicy:
            aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        additionalBehaviors: {
          "/api/*": {
            origin: new aws_cloudfront_origins.HttpOrigin(
              params.apigw.route53RecordName,
            ),
            allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_ALL,
            viewerProtocolPolicy:
              aws_cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            // ポイント：特定のHeaderのみ許可しないと、エラーになる
            // see: https://oji-cloud.net/2020/12/07/post-5752/
            originRequestPolicy: new aws_cloudfront.OriginRequestPolicy(
              this,
              "apigw-orp",
              {
                originRequestPolicyName: `${prefix}-apigw-orp`,
                headerBehavior:
                  aws_cloudfront.OriginRequestHeaderBehavior.allowList(
                    "Accept",
                    "Accept-Language",
                  ),
                cookieBehavior:
                  aws_cloudfront.OriginRequestCookieBehavior.all(),
                queryStringBehavior:
                  aws_cloudfront.OriginRequestQueryStringBehavior.all(),
              },
            ),
            // ポイント：キャッシュを削除しないと、異なる端末からも単一のユーザーでログインしてしまう
            cachePolicy: aws_cloudfront.CachePolicy.fromCachePolicyId(
              this,
              "apigw-cp",
              params.cloudfront.cachePolicyIdForApigw,
            ),
          },
        },
        defaultRootObject: "index.html",
        certificate: acm.Certificate.fromCertificateArn(
          this,
          "certificate-cloudfront",
          params.cloudfront.certificate,
        ),
        domainNames: [params.cloudfront.route53RecordName],
        sslSupportMethod: aws_cloudfront.SSLMethod.SNI,
        minimumProtocolVersion:
          aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      },
    );
    // Route 53 for cloudfront
    const cloudfrontHostedZone = aws_route53.HostedZone.fromLookup(
      this,
      "cloudfront-hosted-zone",
      {
        domainName: params.cloudfront.route53DomainName,
      },
    );
    new aws_route53.ARecord(this, "cloudfront-a-record", {
      zone: cloudfrontHostedZone,
      recordName: params.cloudfront.route53RecordName,
      target: aws_route53.RecordTarget.fromAlias(
        new aws_route53_targets.CloudFrontTarget(distribution),
      ),
    });
  }
}
