import { CloudFrontRequestHandler } from "aws-lambda";

export const handler: CloudFrontRequestHandler = async (event) => {
  const request = event.Records[0].cf.request;
  const uri = request.uri;
  // ファイル名 ("/" で区切られたパスの最後) を取得
  const filename = uri.split("/").pop();
  console.log(`filename: ${filename}`);
  request.uri = "/api/auth/providers/";

  if (uri.endsWith("/")) {
    request.uri = request.uri.concat("index.html");
    console.log(`request.uri: ${request.uri}`);
  } else if (filename) {
    if (!filename.includes(".")) {
      // ファイル名に拡張子がついていない場合、 "/index.html" をつける
      request.uri = request.uri.concat("/index.html");
      console.log(`request.uri: ${request.uri}`);
    }
  }
  return request;
};
