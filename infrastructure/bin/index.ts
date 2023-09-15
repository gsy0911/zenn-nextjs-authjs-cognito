#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as lib from "../lib";

const app = new cdk.App();

new lib.Cognito(app, `${lib.prefix}-cognito`, lib.paramsCognito);
