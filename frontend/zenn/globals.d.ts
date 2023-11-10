declare namespace NodeJS {
  interface ProcessEnv {
    // common
    readonly OUTPUT: "standalone" | "export";
    readonly BACKEND_API_ENDPOINT: string;
    readonly ACCOUNT_ID: string;
    // next-auth.js
    readonly NEXTAUTH_SECRET: string;
    readonly NEXTAUTH_URL: string;
    // cognito
    readonly COGNITO_REGION: string;
    readonly COGNITO_USER_POOL_ID: string;
    readonly COGNITO_CLIENT_ID: string;
    readonly COGNITO_CLIENT_SECRET: string;
    readonly COGNITO_ISSUER: string;
    // cognito-id-pool
    readonly COGNITO_IDENTITY_POOL_ID: string;
  }
}
