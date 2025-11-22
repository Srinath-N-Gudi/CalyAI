"""
CalyAI Backend Server
Handles API calls to Gemini AI and serves the frontend
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
import google.generativeai as genai
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('models/gemini-flash-latest')
    print("[OK] Gemini API configured successfully")
else:
    print("[WARNING] GEMINI_API_KEY not found in .env file")
    model = None

# System prompt for the AI
SYSTEM_PROMPT = """You are CalyAI, a friendly and intelligent calendar assistant.

Your role is to help users schedule tasks, meetings, and events through natural conversation.

CRITICAL BEHAVIOR:
- DO NOT ask questions or ask for confirmation
- AUTOMATICALLY schedule events when the user mentions them
- Find the best available time slot and schedule immediately
- Be proactive and decisive
- Always display the EXACT date and time in your response

CRITICAL: You MUST respond with valid JSON in this exact format:

{
  "message": "Your friendly response with EXACT date and time details",
  "action": "schedule|query|chat",
  "events": [
    {
      "title": "Event Title",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "type": "meeting|study|workout|task|routine|break|coding",
      "duration": 60
    }
  ]
}

Guidelines:
- Always wrap your response in valid JSON
- Be conversational and warm in the "message" field
- ALWAYS mention the exact date (e.g., "Sunday, November 23rd") and exact time (e.g., "10:00 AM to 11:30 AM") in your message
- Use emojis sparingly but effectively  
- For schedule requests, AUTOMATICALLY find available time and schedule - NO questions
- For queries or chat, set "events" to empty array []
- Detect event type automatically (meeting, study, workout, coding, etc.)
- Use 24-hour time format in JSON (HH:MM)
- Infer reasonable durations if not specified (coding: 90min, meetings: 60min, gym: 60min)
- If user says "afternoon", use 14:00-16:00
- If user says "morning", use 09:00-11:00
- If user says "evening", use 18:00-20:00
- Remember conversation history and context

Context will be provided about:
- Current date and time
- User's existing events
- User's preferences (work hours, etc.)
- Available time slots
- Previous conversation

Respond ONLY with valid JSON, no other text."""

@app.route('/')
def index():
    """Serve the main page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('.', path)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages and return AI responses"""
    try:
        data = request.json
        user_message = data.get('message', '')
        context = data.get('context', {})
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        if not model:
            return jsonify({'error': 'Gemini API not configured'}), 500
        
        # Build the full prompt with context
        now = datetime.now()
        current_date = now.strftime('%Y-%m-%d')
        current_day = now.strftime('%A')  # e.g., Friday
        current_time = now.strftime('%H:%M')
        
        events = context.get('events', [])
        preferences = context.get('preferences', {})
        available_slots = context.get('availableSlots', [])
        chat_history = context.get('chatHistory', [])  # NEW: Get chat history
        
        # Format chat history for context
        history_text = ""
        if chat_history and len(chat_history) > 0:
            history_text = "\n\nPREVIOUS CONVERSATION:\n"
            # Include last 10 messages for context
            for msg in chat_history[-10:]:
                role = "User" if msg.get('role') == 'user' else "Assistant"
                content = msg.get('content', '')
                history_text += f"{role}: {content}\n"
        
        # Enhanced context with clear date information
        context_info = f"""
IMPORTANT DATE CONTEXT:
- TODAY is: {current_day}, {current_date} at {current_time}
- Current day of week: {current_day}
- When user says "tomorrow", that means: {(now + __import__('datetime').timedelta(days=1)).strftime('%A, %Y-%m-%d')}
- When user says "next Monday", calculate from today ({current_day})
- When user says "this afternoon", use today's date: {current_date}

User Preferences:
- Work hours: {preferences.get('workStart', '09:00')} to {preferences.get('workEnd', '18:00')}

Current Schedule (showing upcoming events):
{json.dumps(events[:10], indent=2) if events else "No events scheduled"}

Available Time Slots (for today):
{', '.join([f"{s['start']}-{s['end']}" for s in available_slots[:5]]) if available_slots else "Check user's schedule above to find gaps"}
{history_text}
User's NEW request: "{user_message}"

CRITICAL INSTRUCTIONS:
1. ALWAYS use EXACT dates in YYYY-MM-DD format in JSON
2. ALWAYS mention exact date like "Sunday, November 23rd" in your message
3. ALWAYS mention exact time like "10:00 AM to 11:30 AM" or "15:00 to 16:00" in your message
4. Calculate dates relative to TODAY ({current_date})
5. If user says "tomorrow afternoon", use date {(now + __import__('datetime').timedelta(days=1)).strftime('%Y-%m-%d')} and time 14:00-16:00
6. If user says "this afternoon", use date {current_date} and time 14:00-16:00
7. DO NOT ask questions - just schedule automatically
8. Find available time slots from the schedule above and pick the best one

Respond ONLY with valid JSON. No extra text.
"""
        
        full_prompt = SYSTEM_PROMPT + "\n\n" + context_info
        
        print(f"\n{user_message}")
        
        # Add clear JSON instruction to prompt
        full_prompt_with_json = full_prompt + "\n\nIMPORTANT: Respond ONLY with valid JSON. No other text before or after the JSON."
        
        # Call Gemini API
        response = model.generate_content(
            full_prompt_with_json,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2048
            )
        )
        
        # Parse the response
        response_text = response.text
        print(f"[AI] Response: {response_text[:200]}...")
        
        # Clean up response - remove markdown code blocks if present
        cleaned_response = response_text.strip()
        if cleaned_response.startswith('```json'):
            cleaned_response = cleaned_response[7:]  # Remove ```json
        elif cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]  # Remove ```
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]  # Remove ```
        cleaned_response = cleaned_response.strip()
        
        try:
            json_response = json.loads(cleaned_response)
            print(f"[OK] Parsed JSON successfully")
        except json.JSONDecodeError as e:
            print(f"[ERROR] JSON parsing failed: {e}")
            print(f"[RAW] Response text: {cleaned_response[:500]}")
            # If JSON parsing fails, wrap the text response
            json_response = {
                "message": cleaned_response,
                "action": "chat",
                "events": []
            }
        
        return jsonify(json_response)
    
    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return jsonify({
            'error': str(e),
            'message': f'Sorry, I encountered an error: {str(e)}',
            'action': 'chat',
            'events': []
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'gemini_configured': model is not None,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("\n" + "="*50)
    print("[*] CalyAI Server Starting...")
    print("="*50)
    print(f"[*] Server: http://localhost:5000")
    print(f"[*] Open this URL in your browser to use CalyAI")
    print(f"[*] API Status: {'[OK] Ready' if model else '[ERROR] Not configured'}")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
