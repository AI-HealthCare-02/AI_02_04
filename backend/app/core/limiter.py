import os
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_rate_limit(limit:str)->str:
    if os.getenv("TESTING") == "true":
        return "1000/minute"
    return limit

limiter = Limiter(key_func = get_remote_address)
