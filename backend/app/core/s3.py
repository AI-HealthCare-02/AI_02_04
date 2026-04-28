import boto3
import uuid
from app.core.config import settings

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
)


async def upload_diet_image(file_path: str, user_id: int) -> str:
    ext = file_path.split(".")[-1]
    key = f"diet-images/{user_id}/{uuid.uuid4()}.{ext}"

    s3_client.upload_file(file_path, settings.S3_BUCKET_NAME, key)
    return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
