// Frontend Javascript - YouTube AI Agent Premium UI

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const sidebar = document.getElementById('app-sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const apiKeyInput = document.getElementById('gemini-key-input');
    const toggleKeyVisibility = document.getElementById('toggle-key-visibility');
    
    const videoUrlInput = document.getElementById('video-url-input');
    const btnLoadVideo = document.getElementById('btn-load-video');
    
    const videoInfoPanel = document.getElementById('video-info-panel');
    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoIdBadge = document.getElementById('video-id-badge');
    const videoTitle = document.getElementById('video-title');
    const videoAuthor = document.getElementById('video-author');
    
    const btnQuickSummary = document.getElementById('btn-quick-summary');
    const btnQuickInsights = document.getElementById('btn-quick-insights');
    
    const connectionDot = document.getElementById('connection-dot');
    const statusText = document.getElementById('status-text');
    const btnClearChat = document.getElementById('btn-clear-chat');
    
    const welcomeDashboard = document.getElementById('welcome-dashboard');
    const chatDisplayArea = document.getElementById('chat-display-area');
    const chatMessagesContainer = document.getElementById('chat-messages-container');
    
    const chatForm = document.getElementById('chat-form');
    const chatTextInput = document.getElementById('chat-text-input');
    const btnSendMessage = document.getElementById('btn-send-message');
    
    // Application State
    let currentVideoId = null;
    let currentVideoTitle = null;
    let currentSessionId = null;
    let isProcessing = false;

    // Configure Marked.js Options
    if (typeof marked !== 'undefined') {
        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: false,
            mangle: false
        });
    }

    // Initialize: Load API key from local storage if available
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Save API key when edited
    apiKeyInput.addEventListener('input', () => {
        localStorage.setItem('gemini_api_key', apiKeyInput.value.trim());
    });

    // Toggle API Key visibility
    toggleKeyVisibility.addEventListener('click', () => {
        const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        apiKeyInput.setAttribute('type', type);
        const icon = toggleKeyVisibility.querySelector('i');
        if (type === 'text') {
            icon.classList.remove('fa-regular', 'fa-eye');
            icon.classList.add('fa-solid', 'fa-eye-slash');
        } else {
            icon.classList.remove('fa-solid', 'fa-eye-slash');
            icon.classList.add('fa-regular', 'fa-eye');
        }
    });

    // Toggle Sidebar for mobile responsive view
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on main content click (mobile only)
    document.querySelector('.main-content').addEventListener('click', () => {
        if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // Set connection status helper
    function setStatus(status, text) {
        connectionDot.className = 'status-dot';
        if (status === 'ready') {
            connectionDot.classList.add('active');
            statusText.textContent = text || 'Ready';
        } else if (status === 'loading') {
            connectionDot.classList.add('loading');
            statusText.textContent = text || 'Processing...';
        } else {
            statusText.textContent = text || 'Ready';
        }
    }
    
    // Set status to active initial state
    setStatus('ready', 'Connected');

    // Load Video Metadata
    async function loadVideo() {
        const url = videoUrlInput.value.trim();
        if (!url) {
            alert('Please paste a YouTube video URL first.');
            return;
        }

        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter your Gemini API Key in the settings sidebar before proceeding.');
            apiKeyInput.focus();
            return;
        }

        setStatus('loading', 'Loading video details...');
        btnLoadVideo.disabled = true;

        try {
            const response = await fetch('/api/load-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Set active video state
                currentVideoId = data.video_id;
                currentVideoTitle = data.title;
                currentSessionId = `yt_session_${currentVideoId}`;
                
                // Update Sidebar video panel
                videoThumbnail.src = data.thumbnail_url;
                videoIdBadge.textContent = `ID: ${currentVideoId}`;
                videoTitle.textContent = data.title;
                videoAuthor.textContent = data.author;
                
                // Show panel
                videoInfoPanel.classList.remove('hidden');
                
                // Enable inputs
                chatTextInput.disabled = false;
                btnSendMessage.disabled = false;
                chatTextInput.placeholder = `Ask anything about "${data.title}"...`;
                
                // Transition main view
                welcomeDashboard.classList.add('hidden');
                chatMessagesContainer.classList.remove('hidden');
                
                // Reset chat UI history and append initial bot message
                chatMessagesContainer.innerHTML = '';
                appendMessage('bot', `I have successfully analyzed the video captions for **${data.title}** by **${data.author}**. 
                
You can now ask questions about the video content, ask for a summary, or click the quick action buttons in the sidebar.`);
                
                // Focus input
                chatTextInput.focus();
                
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('open');
                }
            } else {
                alert(`Error: ${data.detail || 'Failed to load video.'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Network error while fetching video details.');
        } finally {
            setStatus('ready', 'Connected');
            btnLoadVideo.disabled = false;
        }
    }

    btnLoadVideo.addEventListener('click', loadVideo);
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loadVideo();
    });

    // Helper to append messages to UI
    function appendMessage(role, text) {
        const msgWrapper = document.createElement('div');
        msgWrapper.className = `message-wrapper ${role === 'user' ? 'msg-user' : 'msg-bot'}`;
        
        const meta = document.createElement('div');
        meta.className = 'message-meta';
        meta.textContent = role === 'user' ? 'You' : 'AI Assistant';
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        
        // Parse markdown if marked library is available
        if (typeof marked !== 'undefined') {
            bubble.innerHTML = marked.parse(text);
        } else {
            bubble.textContent = text;
        }
        
        msgWrapper.appendChild(meta);
        msgWrapper.appendChild(bubble);
        chatMessagesContainer.appendChild(msgWrapper);
        
        // Trigger code highlighting
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(bubble);
        }
        
        // Scroll to bottom of chat display
        chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
    }

    // Typing indicator helpers
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            indicator.appendChild(dot);
        }
        
        chatMessagesContainer.appendChild(indicator);
        chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Send chat query to server
    async function handleChatMessage(messageText) {
        if (isProcessing) return;
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter your Gemini API Key in the settings sidebar.');
            return;
        }

        // Show user message
        appendMessage('user', messageText);
        showTypingIndicator();
        
        isProcessing = true;
        setStatus('loading', 'Thinking...');
        
        // Disable chat input while fetching
        chatTextInput.disabled = true;
        btnSendMessage.disabled = true;

        try {
            // Append target YouTube context instruction if this is the first message about the video to ensure transcript analysis triggers
            let processedMessage = messageText;
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: processedMessage,
                    session_id: currentSessionId,
                    api_key: apiKey
                })
            });

            const data = await response.json();
            removeTypingIndicator();

            if (response.ok) {
                appendMessage('bot', data.response);
            } else {
                appendMessage('bot', `⚠️ **Error:** ${data.detail || 'An error occurred while contacting the AI agent.'}`);
            }
        } catch (err) {
            console.error(err);
            removeTypingIndicator();
            appendMessage('bot', `⚠️ **Network Error:** Could not connect to the backend server.`);
        } finally {
            isProcessing = false;
            setStatus('ready', 'Connected');
            chatTextInput.disabled = false;
            btnSendMessage.disabled = false;
            chatTextInput.focus();
        }
    }

    // Handle Form Submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = chatTextInput.value.trim();
        if (!text) return;
        
        chatTextInput.value = '';
        handleChatMessage(text);
    });

    // Quick Action Prompt Triggers
    btnQuickSummary.addEventListener('click', () => {
        if (!currentVideoId) return;
        handleChatMessage(`Summarize this video: https://www.youtube.com/watch?v=${currentVideoId} and give a comprehensive overview with key takeaways.`);
    });

    btnQuickInsights.addEventListener('click', () => {
        if (!currentVideoId) return;
        handleChatMessage(`Extract all key insights, details, and important takeaways from this video (https://www.youtube.com/watch?v=${currentVideoId}).`);
    });

    // Clear Chat Button Action
    btnClearChat.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your local screen conversation history?')) {
            chatMessagesContainer.innerHTML = '';
            
            if (currentVideoId) {
                // Reset session ID to start clean backend memory
                currentSessionId = `yt_session_${currentVideoId}_${Date.now()}`;
                appendMessage('bot', `Conversation cleared. I am ready to answer new questions about **${currentVideoTitle}**.`);
            } else {
                welcomeDashboard.classList.remove('hidden');
                chatMessagesContainer.classList.add('hidden');
                chatTextInput.disabled = true;
                btnSendMessage.disabled = true;
                chatTextInput.placeholder = 'Type a message or ask a question...';
            }
        }
    });
});
