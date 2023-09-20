from logging import INFO, getLogger

from fastapi import APIRouter, FastAPI, Header
from mangum import Mangum

app = FastAPI()
api_router = APIRouter()

logger = getLogger()
logger.setLevel(INFO)


@api_router.get("/admin")
def admin():
    return {"status": "success", "type": "admin"}


@api_router.get("/user")
def user():
    return {"status": "success", "type": "user"}


app.include_router(router=api_router, prefix="/v1")


def main_handler(event, context):
    logger.info(f"{event=}")
    asgi_handler = Mangum(app, lifespan="off")
    return asgi_handler(event, context)
