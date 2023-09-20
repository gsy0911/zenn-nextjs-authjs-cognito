import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import qs from "query-string";
import {
  GetIdCommandInput,
  GetIdCommand,
  GetCredentialsForIdentityCommandInput,
  GetCredentialsForIdentityCommandOutput,
  GetCredentialsForIdentityCommand,
  CognitoIdentityClient,
} from "@aws-sdk/client-cognito-identity";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-universal";

const getCredentialsFromIdToken = async (
  idToken: string,
): Promise<GetCredentialsForIdentityCommandOutput> => {
  const client = new CognitoIdentityClient({
    region: process.env.COGNITO_REGION,
  });
  const loginsKey = `cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;
  const getIdCommandInput: GetIdCommandInput = {
    AccountId: process.env.ACCOUNT_ID,
    IdentityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
    Logins: { [loginsKey]: idToken },
  };
  const identityId = await client.send(new GetIdCommand(getIdCommandInput));

  const getCredentialsForIdentityCommandInput: GetCredentialsForIdentityCommandInput =
    {
      IdentityId: identityId.IdentityId,
      Logins: { [loginsKey]: idToken },
    };
  return await client.send(
    new GetCredentialsForIdentityCommand(getCredentialsForIdentityCommandInput),
  );
};

const getSignedHeaders = async (
  credentials: GetCredentialsForIdentityCommandOutput,
  apiUrl: URL,
) => {
  const signatureV4 = new SignatureV4({
    service: "execute-api",
    region: process.env.COGNITO_REGION,
    credentials: {
      accessKeyId: credentials.Credentials?.AccessKeyId || "",
      secretAccessKey: credentials.Credentials?.SecretKey || "",
      sessionToken: credentials.Credentials?.SessionToken || "",
    },
    sha256: Sha256,
  });
  console.log(`${apiUrl.hostname}, ${apiUrl.pathname}`);
  const httpRequest = new HttpRequest({
    headers: {
      "content-type": "application/json",
      host: apiUrl.hostname,
    },
    hostname: apiUrl.hostname,
    method: "GET",
    path: apiUrl.pathname,
  });
  const signedRequest = await signatureV4.sign(httpRequest);
  return signedRequest.headers;
};

function fixUrl(
  url: string,
  query: Partial<{ [p: string]: string | string[] }>,
) {
  // slugは必ず不要なので削除
  delete query["slug"];
  if (!query) {
    return { url };
  }
  return {
    url: Object.keys(query).length > 0 ? `${url}?${qs.stringify(query)}` : url,
  };
}

const BackendApiClient = axios.create({
  baseURL: `${process.env.BACKEND_API_ENDPOINT}/v1`,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slugs = req.query.slug || ["/"];
  const url: string =
    typeof slugs === "string" ? `/${slugs}` : `/${slugs.join("/")}`;
  const query = req.query;
  const fixedUrl = fixUrl(url, query);
  console.log(
    `method: ${req.method}, query: ${JSON.stringify(
      req.query,
    )}, url: ${url}, fixedUrl: ${fixedUrl.url}`,
  );
  const credentials = await getCredentialsFromIdToken(
    req.headers["authorization"] || "",
  );
  const signedHeaders = await getSignedHeaders(
    credentials,
    new URL(`${process.env.BACKEND_API_ENDPOINT}/v1${fixedUrl.url}`),
  );

  if (req.method === "GET") {
    const options = {
      method: "GET",
      headers: signedHeaders,
      url: fixedUrl.url,
    };
    const result = await BackendApiClient(options)
      .then((res) => {
        return res.data;
      })
      .catch((error) => {
        // error logic
        return { status: "fail", message: error };
      });
    const status = result.status;
    console.log(`status: ${status}`);
    if (status === "success") {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  }
}
