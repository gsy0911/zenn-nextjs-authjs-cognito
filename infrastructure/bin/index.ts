#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as lib from "../lib";

const app = new cdk.App();
const description = "zenn-nextjs-authjs-cognito@v0.5.0";

new lib.Backend(app, `${lib.prefix}-backend`, lib.paramsBackend, {
  env: lib.env,
  description,
});
new lib.LambdaEdgeStack(app, `${lib.prefix}-lambda-edge`, {
  env: lib.envUsEast,
  description,
});
new lib.Frontend(app, `${lib.prefix}-frontend`, lib.paramsFrontend, {
  env: lib.env,
  description,
});
new lib.FrontendWildcardDomain(
  app,
  `${lib.prefix}-frontend-wildcard-domain`,
  lib.paramsFrontendWildCard,
  {
    env: lib.env,
    description,
  },
);

new lib.AuthStack(app, `${lib.prefix}-auth`, lib.paramsAuth, {
  env: lib.env,
  description,
});
