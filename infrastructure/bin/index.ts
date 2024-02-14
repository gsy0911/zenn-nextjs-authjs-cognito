#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as lib from "../lib";

const app = new cdk.App();
const description = "zenn-nextjs-authjs-cognito@v0.5.0";
const prefix = "zenn-example";

new lib.AuthStack(app, `${prefix}-auth`, lib.paramsAuth, {
  env: lib.env,
  description,
});

new lib.ApplicationStack(
  app,
  `${prefix}-application`,
  {},
  {
    env: lib.env,
    description,
  },
);
