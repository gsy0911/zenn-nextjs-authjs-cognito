from logging import INFO, getLogger

from fastapi import APIRouter, FastAPI, Request
from mangum import Mangum
import jwt
import boto3
import s3fs
import os


client = boto3.client("cognito-identity", region_name="ap-northeast-1")
idp = boto3.client("cognito-idp", region_name="ap-northeast-1")


app = FastAPI()
api_router = APIRouter()

logger = getLogger()
logger.setLevel(INFO)

REGION = "ap-northeast-1"
ACCOUNT_ID = os.environ["ACCOUNT_ID"]
USER_POOL_ID = os.environ["USER_POOL_ID"]
IDENTITY_POOL_ID = os.environ["IDENTITY_POOL_ID"]
S3_BUCKET = os.environ["S3_BUCKET"]


def _get_credentials_from_id_token(id_token: str) -> dict:
    logins = {f"cognito-idp.{REGION}.amazonaws.com/{USER_POOL_ID}": id_token}
    decode_jwt = jwt.decode(id_token, options={"verify_signature": False})
    # ユーザーが存在するかの確認
    # 存在しない場合はエラーになる
    user_info = idp.admin_get_user(UserPoolId=USER_POOL_ID, Username=decode_jwt["cognito:username"])
    print(f"{user_info=}")

    # identity-poolからidを取得する
    cognito_identity_id = client.get_id(
        AccountId=ACCOUNT_ID, IdentityPoolId=IDENTITY_POOL_ID, Logins=logins
    )
    # get ACCESS_KEY, SECRET_KEY, etc...
    credentials = client.get_credentials_for_identity(
        IdentityId=cognito_identity_id["IdentityId"], Logins=logins
    )
    return credentials


@api_router.get("/admin")
def admin():
    return {"status": "success", "type": "admin"}


@api_router.get("/user")
def user():
    return {"status": "success", "type": "user"}


@api_router.get("/read-file")
def read_file(request: Request):
    lambda_event = request.scope["aws.event"]
    print(f"{lambda_event=}")
    id_token = lambda_event["headers"]["idToken"]
    credentials = _get_credentials_from_id_token(id_token=id_token)
    fs = s3fs.S3FileSystem(
        anon=False,
        key=credentials["Credentials"]["AccessKeyId"],
        secret=credentials["Credentials"]["SecretKey"],
        token=credentials["Credentials"]["SessionToken"],
    )
    with fs.open(f"s3://{S3_BUCKET}/cognito-test/{credentials['IdentityId']}/data.txt", "r") as f:
        data = f.readline()
    return {"status": "success", "type": "common", "data": data}


app.include_router(router=api_router, prefix="/v1")


def main_handler(event, context):
    asgi_handler = Mangum(app, lifespan="off")
    return asgi_handler(event, context)
