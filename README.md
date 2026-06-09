# 🎬 Custom YouTube AI Agent - Premium Workspace

This is a customized, high-fidelity Single-Page Application (SPA) that acts as an AI assistant for YouTube videos. It is built as a replacement for the default Streamlit interface to provide a much cleaner, responsive, and aesthetically premium user interface (inspired by modern Figma product designs).

---

## 🎨 **Features**
*   **Figma-Inspired UI**: Built with HTML, Vanilla CSS, and modern JavaScript featuring glassmorphism elements, YouTube-red gradients, and smooth animations.
*   **API Key Security**: Users input their Gemini API Key in the UI sidebar. It is saved in the browser's `localStorage` and never hardcoded into source control or logs.
*   **Active Video Panel**: Pasting a YouTube URL automatically fetches the video's title, channel author, and thumbnail (via oEmbed) and displays an active preview in the sidebar.
*   **Persistent Chat Memory**: Conversations are dynamically stored in a SQLite database file (`tmp/data.db`) grouped by video session ID (`yt_session_VIDEOID`), allowing the agent to remember context per video.
*   **Markdown & Code Rendering**: Incorporates `marked.js` and `prism.js` from CDNs for responsive Markdown formatting and syntax-highlighted code blocks in bot replies.

---

## 🏗️ **Architecture & Tech Stack**
*   **Frontend**: Single Page Application (HTML5, Vanilla CSS, Vanilla JavaScript, FontAwesome, Marked.js, Prism.js).
*   **Backend**: FastAPI serving static files and exposing endpoints for video loading and AI agent chat processing.
*   **AI Agent**: Agno AI framework (formerly Phidata) with the Gemini 2.0 model and Google GenAI SDK.
*   **Session Database**: SQLite managed via SQLAlchemy inside Agno.

---

## 🛠️ **Installation & Setup**

### **Step 1: Clone or Navigate to the Directory**
```bash
cd /home/mic-711/ai-lab/youtube-ai-agent-custom
```

### **Step 2: Install Dependencies**
Install the backend requirements. It is recommended to install them to your user directory (or virtual environment):
```bash
pip install --user -r requirements.txt
```

### **Step 3: Setup Environment Variables (Optional)**
You can copy the environment template and set your Gemini API key there, or you can simply paste it in the frontend UI when running the app.
```bash
cp .env.example .env
```

---

## 🚀 **Quick Start**

### **Launch the Application**
Run the FastAPI application from the project directory:
```bash
python main.py
```

### **Access in Browser**
Open your web browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 💡 **Usage Guides**
1.  **Configure API Key**: Provide your Gemini API key in the sidebar panel.
2.  **Paste YouTube URL**: Paste a watch, shorts, or embed URL and click **Load Video**.
3.  **Quick Action Prompts**: Use the quick buttons in the sidebar:
    *   **Summarize Video**: Triggers a detailed chronological breakdown of the transcript.
    *   **Key Insights**: Extracts major takeaways and lessons.
4.  **Custom Q&A**: Ask any specific question about the video contents in the chat input at the bottom.
