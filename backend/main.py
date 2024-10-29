from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from apps.calculator.route import router as calculator_router  # Import the calculator router
from constants import SERVER_URL, PORT, ENV  # Import server configuration constants

# Define an async context manager to handle app lifespan events, if needed
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield  # Placeholder for any setup/teardown logic that may be added in the future

# Initialize the FastAPI app with a lifespan context manager
app = FastAPI(lifespan=lifespan)

# Configure CORS middleware to allow cross-origin requests from any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow requests from all origins
    allow_credentials=True,        # Allow credentials (cookies, authorization headers)
    allow_methods=["*"],           # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],           # Allow all headers
)

# Define a simple health check route to verify server status
@app.get("/")
async def health():
    return {'message': 'Server is running'}

# Include the calculator router for handling requests to /calculate
app.include_router(calculator_router, prefix="/calculate", tags=["calculate"])

# Run the FastAPI app using Uvicorn, with reloading enabled in development environment
if __name__ == "__main__":
    uvicorn.run("main:app", host=SERVER_URL, port=int(PORT), reload=(ENV == "dev"))
