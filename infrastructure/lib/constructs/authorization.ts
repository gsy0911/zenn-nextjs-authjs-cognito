import { aws_cognito, aws_iam } from "aws-cdk-lib";
import {
  IdentityPool,
  IdentityPoolProviderUrl,
  RoleMappingMatchType,
  RoleMappingRule,
  UserPoolAuthenticationProvider,
  IUserPoolAuthenticationProvider,
  IdentityPoolRoleMapping,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { Construct } from "constructs";
import { environment } from "./common";

interface AuthorizationProps {
  environment: environment;
  servicePrefix: string;
  userPools?: IUserPoolAuthenticationProvider[];
  roleMappings?: IdentityPoolRoleMapping[];
}

export class Authorization extends Construct {
  constructor(scope: Construct, id: string, props: AuthorizationProps) {
    super(scope, id);

    const { environment, servicePrefix, userPools, roleMappings } = props;

    /** ID POOL */
    new IdentityPool(this, "IdentityPool", {
      identityPoolName: `${servicePrefix}-identity-pool-${environment}`,
      allowUnauthenticatedIdentities: false,
      authenticationProviders: {
        userPools,
      },
      roleMappings,
    });
  }
}

interface AuthorizationGroupAndRoleProps {
  environment: environment;
  servicePrefix: string;
  userPool: aws_cognito.UserPool;
  callbackUrls: string[];
  logoutUrls: string[];
  idPool: {
    adminRoleResources: string[];
    userRoleResources: string[];
    s3Bucket: string;
    idPoolId: `ap-northeast-1:${string}`;
  };
}

export class AuthorizationGroupAndRole extends Construct {
  readonly userPool: IUserPoolAuthenticationProvider;
  readonly roleMapping: IdentityPoolRoleMapping;

  constructor(scope: Construct, id: string, props: AuthorizationGroupAndRoleProps) {
    super(scope, id);

    const { environment, servicePrefix, userPool, callbackUrls, logoutUrls } = props;

    // App Clients
    const privateClient = userPool.addClient(`${servicePrefix}-PrivateClient`, {
      userPoolClientName: `${servicePrefix}-private-client`,
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      oAuth: {
        callbackUrls,
        logoutUrls,
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [aws_cognito.OAuthScope.OPENID, aws_cognito.OAuthScope.EMAIL],
      },
      preventUserExistenceErrors: true,
    });

    // IdentityPoolからassumeできるIAM Role
    const federatedPrincipal = new aws_iam.FederatedPrincipal(
      "cognito-identity.amazonaws.com",
      {
        StringEquals: {
          "cognito-identity.amazonaws.com:aud": props.idPool.idPoolId,
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated",
        },
      },
      "sts:AssumeRoleWithWebIdentity",
    );
    const adminRole = new aws_iam.Role(this, "AdminRole", {
      roleName: `${servicePrefix}-api-gateway-admin-role-${environment}`,
      assumedBy: federatedPrincipal,
      inlinePolicies: {
        executeApi: new aws_iam.PolicyDocument({
          statements: [
            // API Gatewayのリソースへのアクセス
            new aws_iam.PolicyStatement({
              effect: aws_iam.Effect.ALLOW,
              resources: props.idPool.adminRoleResources,
              actions: ["execute-api:Invoke"],
            }),
            // S3のリソースへのアクセス
            new aws_iam.PolicyStatement({
              effect: aws_iam.Effect.ALLOW,
              actions: ["s3:ListBucket"],
              resources: [`arn:aws:s3:::${props.idPool.s3Bucket}`],
              conditions: { StringLike: { "s3:prefix": ["cognito-test"] } },
            }),
            new aws_iam.PolicyStatement({
              effect: aws_iam.Effect.ALLOW,
              resources: [
                `arn:aws:s3:::${props.idPool.s3Bucket}/cognito-test/\${cognito-identity.amazonaws.com:sub}`,
                `arn:aws:s3:::${props.idPool.s3Bucket}/cognito-test/\${cognito-identity.amazonaws.com:sub}/*`,
              ],
              actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            }),
          ],
        }),
      },
    });

    const userRole = new aws_iam.Role(this, "UserRole", {
      roleName: `${servicePrefix}-api-gateway-user-role-${environment}`,
      assumedBy: federatedPrincipal,
      inlinePolicies: {
        executeApi: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              effect: aws_iam.Effect.ALLOW,
              resources: props.idPool.userRoleResources,
              actions: ["execute-api:Invoke"],
            }),
            new aws_iam.PolicyStatement({
              effect: aws_iam.Effect.ALLOW,
              actions: ["s3:ListBucket"],
              resources: [`arn:aws:s3:::${props.idPool.s3Bucket}`],
              conditions: { StringLike: { "s3:prefix": ["cognito-test"] } },
            }),
            new aws_iam.PolicyStatement({
              effect: aws_iam.Effect.ALLOW,
              resources: [
                `arn:aws:s3:::${props.idPool.s3Bucket}/cognito-test/\${cognito-identity.amazonaws.com:sub}`,
                `arn:aws:s3:::${props.idPool.s3Bucket}/cognito-test/\${cognito-identity.amazonaws.com:sub}/*`,
              ],
              actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            }),
          ],
        }),
      },
    });

    // Cognitoのグループ作成
    new aws_cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: userPool.userPoolId,
      description: "description",
      groupName: `${servicePrefix}-admin-group`,
      precedence: 0,
      roleArn: adminRole.roleArn,
    });
    new aws_cognito.CfnUserPoolGroup(this, "UserGroup", {
      userPoolId: userPool.userPoolId,
      description: "description",
      groupName: `${servicePrefix}-user-group`,
      precedence: 100,
      roleArn: userRole.roleArn,
    });

    const adminRMR: RoleMappingRule = {
      claim: "cognito:groups",
      claimValue: "admin",
      mappedRole: adminRole,
      matchType: RoleMappingMatchType.CONTAINS,
    };

    const userRMR: RoleMappingRule = {
      claim: "cognito:groups",
      claimValue: "user",
      mappedRole: userRole,
      matchType: RoleMappingMatchType.CONTAINS,
    };

    // Authorizationで利用しやすくするための変数定義
    this.userPool = new UserPoolAuthenticationProvider({
      userPool,
      userPoolClient: privateClient,
    });
    this.roleMapping = {
      providerUrl: IdentityPoolProviderUrl.userPool(
        `cognito-idp.ap-northeast-1.amazonaws.com/${userPool.userPoolId}:${privateClient.userPoolClientId}`,
      ),
      useToken: false,
      mappingKey: servicePrefix,
      resolveAmbiguousRoles: false,
      // 新しいサービスを追加する場合は、ここにmappingを追加すること
      rules: [adminRMR, userRMR],
    };
  }
}
