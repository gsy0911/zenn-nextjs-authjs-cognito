# zenn-nextjs-authjs-cognito

## initialize

```shell
# at ./infrastructure
$ cdk init --app cognito --language typescript

# at ./frontend
$ npx create-next-app@latest  my-app
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … No
✔ Would you like to use `src/` directory? … No
✔ Would you like to use App Router? (recommended) … No
✔ Would you like to customize the default import alias? … No
```


## deploy

```shell
# at ./infrastructure
$ npm install
$ cdk ls
zenn-example-cognito

$ cdk deploy zenn-example-cognito
```

```shell
# at ./frontend/zenn
$ npm install
$ npm run dev
```

## articles


- v5.0 @ null
- v4.0 @ [【NextAuth.js】Next.jsのPages RouterをCloudFrontとAPI Gatewayで稼働させる](https://zenn.dev/gsy0911/articles/9bddce24f45a09)
- v3.0 @ [【NextAuth.js/認可】S3バケットへのアクセスをIdTokenで制限する](https://zenn.dev/gsy0911/articles/bd26af3a69ee40)
- v2.0 @ [【NextAuth.js/認可】IAM認証されたAPI GatewayにIdTokenを使ってアクセスする](https://zenn.dev/gsy0911/articles/5f3290ca3a54ce)
- v1.0 @ [【NextAuth.js/認証】Cognitoでカスタムサインインページを作成する](https://zenn.dev/gsy0911/articles/0e271401b8e5c2)
