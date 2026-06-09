import re
import os
import requests
from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from agent_service import get_agent

app = FastAPI(
    title="YouTube AI Agent API",
    description="Backend API for interacting with the YouTube AI Agent.",
    version="1.0.0"
)

# Enable CORS for local development and access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class LoadVideoRequest(BaseModel):
    url: str

class LoadVideoResponse(BaseModel):
    video_id: str
    title: str
    author: str
    thumbnail_url: str

class ChatRequest(BaseModel):
    message: str
    session_id: str
    api_key: Optional[str] = None

class ChatResponse(BaseModel):
    response: str

def extract_video_id(url: str) -> Optional[str]:
    """
    Helper to extract the 11-character YouTube video ID from various URL formats.
    """
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11})(?:\?|&|$)',
        r'youtu\.be\/([0-9A-Za-z_-]{11})',
        r'embed\/([0-9A-Za-z_-]{11})',
        r'shorts\/([0-9A-Za-z_-]{11})'
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

@app.post("/api/load-video", response_model=LoadVideoResponse)
def load_video(request: LoadVideoRequest):
    """
    Endpoint to fetch YouTube video metadata using the public oEmbed API.
    """
    video_url = request.url.strip()
    video_id = extract_video_id(video_url)
    
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL. Please make sure it is a valid YouTube video or short link.")
    
    try:
        # Fetch metadata using public YouTube oEmbed endpoint
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        res = requests.get(oembed_url, timeout=10)
        
        if res.status_code == 200:
            data = res.json()
            return LoadVideoResponse(
                video_id=video_id,
                title=data.get("title", "YouTube Video"),
                author=data.get("author_name", "Unknown Creator"),
                thumbnail_url=f"/api/thumbnail/{video_id}"
            )
        else:
            # Fallback metadata if oembed fails
            return LoadVideoResponse(
                video_id=video_id,
                title=f"YouTube Video (ID: {video_id})",
                author="YouTube Creator",
                thumbnail_url=f"/api/thumbnail/{video_id}"
            )
    except Exception as e:
        # Handle general errors (e.g. network timeout) and fallback
        return LoadVideoResponse(
            video_id=video_id,
            title=f"YouTube Video (ID: {video_id})",
            author="YouTube Creator",
            thumbnail_url=f"/api/thumbnail/{video_id}"
        )

from fastapi.responses import Response

@app.get("/api/thumbnail/{video_id}")
def get_thumbnail(video_id: str):
    """
    Proxy endpoint to fetch YouTube video thumbnail server-side.
    This resolves issues with browser cross-origin blocks and ad-blockers.
    """
    # Try different YouTube thumbnail quality servers
    urls = [
        f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/sddefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        f"https://img.youtube.com/vi/{video_id}/mqdefault.jpg",
        f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
    ]
    
    for url in urls:
        try:
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                # Return the image response directly
                return Response(content=res.content, media_type="image/jpeg")
        except Exception:
            continue
            
    raise HTTPException(status_code=404, detail="Thumbnail not found")

@app.post("/api/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):

    """
    Endpoint to send queries to the Agno AI Agent.
    """
    if not request.message or request.message.strip() == "":
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    try:
        # Initialize agent with potential API key override from client headers/body
        agent = get_agent(api_key=request.api_key, session_id=request.session_id)
        
        # Run agent query
        response = agent.run(request.message)
        content = response.content if hasattr(response, 'content') else str(response)
        
        return ChatResponse(response=content)
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI Agent error: {str(e)}")

# Mount static files to serve the frontend SPA directly
# Ensure static folder exists first
os.makedirs("static", exist_ok=True)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    # Read port/host from env if available
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"Starting YouTube AI Agent server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
