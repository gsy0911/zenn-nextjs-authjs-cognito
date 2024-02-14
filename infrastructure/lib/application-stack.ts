import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Backend } from "./constructs/backend";
import { Frontend } from "./constructs/frontend";
import { paramsBackend, paramsFrontend } from "./params";

export interface ApplicationStackProps {}

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, params: ApplicationStackProps, props: StackProps) {
    super(scope, id, props);

    // バックエンド
    new Backend(this, "Backend", paramsBackend);

    // フロントエンド
    new Frontend(this, "Frontend", paramsFrontend);
  }
}
