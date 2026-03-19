import os
from dotenv import load_dotenv
from google import genai

# 1. Load environment variables once
load_dotenv()
# 2. Fetch API Key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY not found in .env file!")

# 3. Create a single Shared Client
# Import this 'client' variable in other files instead of creating a new one
client = genai.Client(api_key=GOOGLE_API_KEY)

# 4. (Optional) Centralized Configuration Constants
MODEL_NAME = "gemini-2.5-flash"
