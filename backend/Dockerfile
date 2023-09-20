FROM public.ecr.aws/lambda/python:3.11

RUN pip install -U pip poetry==1.5.1
COPY pyproject.toml .
COPY poetry.lock .

RUN poetry export --without-hashes --only main --output requirements.txt
RUN pip install -r requirements.txt

COPY backend/src ./

CMD ["lambda_handlers.main_handler"]
