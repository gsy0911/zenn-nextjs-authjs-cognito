import {
  Stack,
  StackProps,
  aws_lambda,
  aws_lambda_nodejs,
  aws_iam,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { XRegionParam } from "./XRegionParam";
import { prefix, ssmParameterEdgeName } from "./constants";

interface IDefLambdaFunctionProps {
  constructor: Construct;
  id: string;
  cfType: "viewer-request" | "origin-request" | "origin-response";
  lambdaNamePrefix: string;
  dirName: string;
  role: aws_iam.IRole;
  handler: "handler" | string;
}

const defNodejsFunction = (
  props: IDefLambdaFunctionProps,
): aws_lambda_nodejs.NodejsFunction => {
  const functionProps: aws_lambda_nodejs.NodejsFunctionProps = {
    functionName: `${prefix}-edge-${props.lambdaNamePrefix}`,
    entry: `./lib/lambda/edges/${props.dirName}/index.ts`,
    handler: props.handler,
    role: props.role,
    bundling: {
      preCompilation: true,
      loader: {
        ".html": "text",
      },
    },
    runtime: aws_lambda.Runtime.NODEJS_18_X,
    architecture: aws_lambda.Architecture.X86_64,
    awsSdkConnectionReuse: false,
  };

  const lambdaFunction = new aws_lambda_nodejs.NodejsFunction(
    props.constructor,
    props.lambdaNamePrefix,
    functionProps,
  );
  new aws_lambda.Alias(props.constructor, `${props.lambdaNamePrefix}CfAlias`, {
    aliasName: "latest",
    version: lambdaFunction.currentVersion,
  });
  const parameterName = ssmParameterEdgeName({
    cfType: props.cfType,
    id: props.lambdaNamePrefix,
  });
  new XRegionParam(
    props.constructor,
    `x-region-param-${props.lambdaNamePrefix}`,
    {
      region: "ap-northeast-1",
    },
  ).putSsmParameter({
    parameterName,
    parameterValue: `${lambdaFunction.functionArn}:${lambdaFunction.currentVersion.version}`,
    parameterDataType: "text",
    idName: `x-region-param-id-${props.id}`,
  });
  return lambdaFunction;
};

export class LambdaEdgeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /** lambda role */
    const role = new aws_iam.Role(this, "lambdaRole", {
      roleName: `${id}-lambda-role`,
      assumedBy: new aws_iam.CompositePrincipal(
        new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
        new aws_iam.ServicePrincipal("edgelambda.amazonaws.com"),
      ),
      managedPolicies: [
        aws_iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "CWFullAccess",
          "arn:aws:iam::aws:policy/CloudWatchFullAccessV2",
        ),
        aws_iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "CognitoAccess",
          "arn:aws:iam::aws:policy/AmazonCognitoPowerUser",
        ),
      ],
    });

    defNodejsFunction({
      constructor: this,
      id,
      cfType: "origin-request",
      lambdaNamePrefix: `nextCompatibility`,
      dirName: "next-compatibility",
      role,
      handler: "handler",
    });
  }
}
