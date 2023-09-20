import {
  Duration,
  Stack,
  StackProps,
  RemovalPolicy,
  aws_cognito,
  aws_iam,
} from "aws-cdk-lib";
import {
  IdentityPool,
  IdentityPoolProviderUrl,
  RoleMappingMatchType,
  RoleMappingRule,
  UserPoolAuthenticationProvider,
} from "@aws-cdk/aws-cognito-identitypool-alpha";
import { Construct } from "constructs";
import { prefix } from "./constants";

export interface ICognitoStack {
  domainPrefix: string;
  callbackUrls: string[];
  logoutUrls: string[];
  idPool: {
    apigwRestApiId: string;
    idPoolId: `ap-northeast-1:${string}`;
  };
}

const adminOnlyApiGwResource = (
  accountId: string,
  apigwRestApiId: string,
): string[] => {
  return [
    `arn:aws:execute-api:ap-northeast-1:${accountId}:${apigwRestApiId}/v1/GET/admin`,
  ];
};

const userOnlyApiGwResource = (
  accountId: string,
  apigwRestApiId: string,
): string[] => {
  return [
    `arn:aws:execute-api:ap-northeast-1:${accountId}:${apigwRestApiId}/v1/GET/user`,
  ];
};

export class Cognito extends Stack {
  constructor(
    scope: Construct,
    id: string,
    params: ICognitoStack,
    props?: StackProps,
  ) {
    super(scope, id, props);
    const accountId = Stack.of(this).account;

    /** USER POOL */
    const userPool = new aws_cognito.UserPool(this, "user-pool", {
      userPoolName: `${prefix}-user-pool`,
      // sign-up
      selfSignUpEnabled: false,
      // sign-in
      signInAliases: {
        username: true,
        email: true,
      },
      // user attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      mfa: aws_cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(3),
      },
      // emails, by default `no-reply@verificationemail.com` used
      accountRecovery: aws_cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // App Clients
    const privateClient = userPool.addClient("private-client", {
      userPoolClientName: "private-client",
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
        adminUserPassword: true,
      },
      oAuth: {
        callbackUrls: params.callbackUrls,
        logoutUrls: params.logoutUrls,
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [aws_cognito.OAuthScope.OPENID, aws_cognito.OAuthScope.EMAIL],
      },
    });

    userPool.addDomain("cognito-domain", {
      cognitoDomain: {
        domainPrefix: params.domainPrefix,
      },
    });

    // IdentityPoolからassumeできるIAM Role
    const federatedPrincipal = new aws_iam.FederatedPrincipal(
      "cognito-identity.amazonaws.com",
      {
        StringEquals: {
          "cognito-identity.amazonaws.com:aud": params.idPool.idPoolId,
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated",
        },
      },
      "sts:AssumeRoleWithWebIdentity",
    );

    const adminRole = new aws_iam.Role(this, "admin-role", {
      roleName: `${prefix}-api-gateway-admin-role`,
      assumedBy: federatedPrincipal,
      inlinePolicies: {
        executeApi: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              effect: aws_iam.Effect.ALLOW,
              resources: adminOnlyApiGwResource(
                accountId,
                params.idPool.apigwRestApiId,
              ),
              actions: ["execute-api:Invoke"],
            }),
          ],
        }),
      },
    });

    const userRole = new aws_iam.Role(this, "user-role", {
      roleName: `${prefix}-api-gateway-user-role`,
      assumedBy: federatedPrincipal,
      inlinePolicies: {
        executeApi: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              effect: aws_iam.Effect.ALLOW,
              resources: userOnlyApiGwResource(
                accountId,
                params.idPool.apigwRestApiId,
              ),
              actions: ["execute-api:Invoke"],
            }),
          ],
        }),
      },
    });

    // CognitoのAdminグループ作成
    new aws_cognito.CfnUserPoolGroup(this, "admin-group", {
      userPoolId: userPool.userPoolId,
      description: "description",
      groupName: "admin",
      precedence: 0,
      roleArn: adminRole.roleArn,
    });
    const adminRMR: RoleMappingRule = {
      claim: "cognito:groups",
      claimValue: "admin",
      mappedRole: adminRole,
      matchType: RoleMappingMatchType.CONTAINS,
    };

    // CognitoのUserグループ作成
    new aws_cognito.CfnUserPoolGroup(this, "user-group", {
      userPoolId: userPool.userPoolId,
      description: "description",
      groupName: "user",
      precedence: 100,
      roleArn: userRole.roleArn,
    });
    const userRMR: RoleMappingRule = {
      claim: "cognito:groups",
      claimValue: "user",
      mappedRole: userRole,
      matchType: RoleMappingMatchType.CONTAINS,
    };

    /** ID POOL */
    new IdentityPool(this, "identity-pool", {
      identityPoolName: `${prefix}-identity-pool`,
      allowUnauthenticatedIdentities: false,
      authenticatedRole: userRole,
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool,
            userPoolClient: privateClient,
          }),
        ],
      },
      roleMappings: [
        {
          providerUrl: IdentityPoolProviderUrl.userPool(
            `cognito-idp.ap-northeast-1.amazonaws.com/${userPool.userPoolId}:${privateClient.userPoolClientId}`,
          ),
          useToken: false,
          mappingKey: "userpool",
          resolveAmbiguousRoles: false,
          rules: [adminRMR, userRMR],
        },
      ],
    });
  }
}
