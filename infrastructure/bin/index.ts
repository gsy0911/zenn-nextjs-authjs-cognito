#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as lib from "../lib";

const app = new cdk.App();

new lib.Cognito(app, `${lib.prefix}-cognito`, lib.paramsCognito, {
  env: lib.env,
  description: lib.description,
});
new lib.Backend(app, `${lib.prefix}-backend`, lib.paramsBackend, {
  env: lib.env,
  description: lib.description,
});
new lib.LambdaEdgeStack(app, `${lib.prefix}-lambda-edge`, {
  env: lib.envUsEast,
  description: lib.description,
});
new lib.Frontend(app, `${lib.prefix}-frontend`, lib.paramsFrontend, {
  env: lib.env,
  description: lib.description,
});
new lib.FrontendWildcardDomain(
  app,
  `${lib.prefix}-frontend-wildcard-domain`,
  lib.paramsFrontendWildCard,
  {
    env: lib.env,
    description: lib.description,
  },
);
