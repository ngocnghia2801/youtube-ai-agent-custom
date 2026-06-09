import os
from agno.agent import Agent
from agno.db.sqlite import SqliteDb
from agno.tools.youtube import YouTubeTools
from agno.models.google import Gemini
from dotenv import load_dotenv

# Load server-side environment variables if present
load_dotenv()

def get_agent(api_key: str = None, session_id: str = "default_session"):
    """
    Dynamically initializes the Agno YouTube Agent.
    
    Args:
        api_key (str, optional): The Gemini API key passed from the client frontend.
                                 If not provided, falls back to the GEMINI_API_KEY environment variable.
        session_id (str, optional): The chat session identifier. Defaults to 'default_session'.
    """
    # Use client-provided API key or fallback to server env
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key or key.strip() == "":
        raise ValueError("Gemini API key is required. Please enter it in the sidebar settings or configure it in the backend `.env` file.")
    
    # Ensure temporary directory exists for sqlite storage
    os.makedirs("tmp", exist_ok=True)
    
    # Setup SQLite session DB
    db = SqliteDb(db_file="tmp/data.db", session_table="agent_sessions")
    
    # Return initialized Agno Agent
    return Agent(
        model=Gemini(id="gemini-3.5-flash", api_key=key),
        description="You are a YouTube agent. Obtain the captions of a YouTube video and answer questions.",


        session_id=session_id,
        db=db,
        add_history_to_context=True,
        num_history_runs=20,
        tools=[YouTubeTools()],
    )

