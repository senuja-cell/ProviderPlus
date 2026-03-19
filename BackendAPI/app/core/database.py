import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv
from pymongo.errors import ServerSelectionTimeoutError

from ..models.provider_model import Provider
from ..models.user_model import User
from ..models.category_model import Category
from ..models.push_token_model import PushToken
from ..models.message_model import Message
from ..models.conversation_model import Conversation
from ..models.booking_model import Booking


# function that connects the app with MongoDB
async def init_db():
    load_dotenv()
    # MongoDB URL
    uri = os.getenv("MONGO_URL")

    if not uri:
        raise ValueError("MONGO_URL not found!")

    try:
        # create the motor client
        client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)

        # ping to check connection
        await client.server_info()

        # select db name
        database = client.providerplus_db

        await init_beanie(
            database=database,
            document_models=[
                # add the response models the database returns
                Provider,
                User,
                Category,
                Conversation,
                Message,
                PushToken,
                Booking,
            ]
        )
    # handling relevant errors
    except ServerSelectionTimeoutError as e:
        print("DB connection error. Could not connect to the MongoDB Cloud")
        print("Check your internet connection")
        raise e

    # handling errors that might unexpectedly occur
    except Exception as e:
        print("An unexpected error occurred.")
        raise e

    print("✅ MongoDB connection established")

    # Return database for GridFS initialization
    return database
