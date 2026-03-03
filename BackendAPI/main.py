import os
import traceback
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.routes import chatbot_routes, analysis_routes, auth_routes, provider_routes, messaging_routes
from app.core.database import init_db
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routes import chatbot_routes, analysis_routes, auth_routes, provider_routes, payment_routes

DEBUG = os.getenv("DEBUG", "false").lower() == "true"


# DB startup/shutdown logic
@asynccontextmanager
async def lifespan(app: FastAPI):
    # start
    print("starting provider+ database")
    await init_db()
    yield

    # shutdown
    print("shutting down")


app = FastAPI(lifespan=lifespan)


# 422 - Request body doesn't match your Pydantic models
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error on {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Invalid request data",
            "details": exc.errors()  # tells you exactly which field failed and why
        }
    )

# 400/401/403/404 etc - HTTP errors you raise yourself with HTTPException
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    print(f"HTTP {exc.status_code} on {request.url}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail
        }
    )

# 500 - Anything unexpected
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()  # always prints full stack trace to IntelliJ console

    if DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "error": str(exc),
                "traceback": traceback.format_exc(),
                "path": str(request.url)
            }
        )

    return JSONResponse(
        status_code=500,
        content={
            "error": "An unexpected error occurred. Please try again later."
        }
    )



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows ALL origins (perfect for dev/viva)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)
# ----------------------


app.include_router(chatbot_routes.router, prefix="/api/ai-chat", tags=["AI Chat"])
app.include_router(analysis_routes.router, prefix="/api/ai-integration", tags=["AI Integration"])
app.include_router(auth_routes.router, prefix="/api", tags=["Authentication"])
app.include_router(provider_routes.router, prefix="/api/category-search")
app.include_router(payment_routes.router, prefix="/api/payment", tags=["Payment"])
app.include_router(messaging_routes.router, prefix="/api", tags=["Messaging"])


@app.get("/")
def read_root():
    return {"message: Provider+ backend is running!"}

