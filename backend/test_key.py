import os
from dotenv import load_dotenv
from google import genai

# 1. This finds the exact folder where this test script lives
script_dir = os.path.dirname(os.path.abspath(__file__))

# 2. This points directly to the .env file sitting next to it
env_path = os.path.join(script_dir, '.env')

# 3. This forces Python to load that specific file
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print(f"Error: No key found. I looked exactly here: {env_path}")
    print("Make sure your file is named '.env' and contains GEMINI_API_KEY.")
else:
    try:
        print("Key found! Attempting to contact Gemini...")
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="Say 'Hello World' if the connection is successful."
        )
        print("Success! The API responded with:", response.text)
    except Exception as e:
        print("Failed to connect. Error:", e)