import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Ollama configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:1.5b")

def get_ollama_model():
    """Checks user's installed models, prioritizing 1.5b for massive speed gains and GPU stability."""
    try:
        # Quick timeout probe to fetch tags
        r = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=2)
        if r.status_code == 200:
            models_list = r.json().get('models', [])
            available = [m.get('name') for m in models_list if m.get('name')]
            if not available:
                return OLLAMA_MODEL
            
            # 1. First choice: Exact matching preferred model
            for candidate in available:
                if OLLAMA_MODEL in candidate:
                    return candidate
            
            # 2. Second choice: Any local 1.5b variant for ultra speed & GPU stability
            for candidate in available:
                if "1.5b" in candidate.lower():
                    return candidate
            
            # 3. Third choice: Any coder or qwen base
            for candidate in available:
                if "coder" in candidate.lower() or "qwen" in candidate.lower():
                    return candidate
            
            # Fallback to first active model
            return available[0]
    except Exception:
        pass
    return OLLAMA_MODEL

def extract_video_id(url):
    """Extract video ID from YouTube URL"""
    if "youtube.com/watch" in url:
        params = url.split("?")[1]
        for param in params.split("&"):
            if param.startswith("v="):
                return param[2:]
    elif "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]
    elif "youtube.com/embed/" in url:
        return url.split("youtube.com/embed/")[1].split("?")[0]
    return None

def get_video_info(video_id):
    """Get video info from ID"""
    return {
        "video_id": video_id,
        "title": "Video",
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
    }

@app.route('/api/extract', methods=['POST'])
def extract_transcript():
    """Extract transcript from YouTube video"""
    data = request.get_json()
    url = data.get('url', '')

    if not url:
        return jsonify({"error": "URL is required"}), 400

    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({"error": "Invalid YouTube URL"}), 400

    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(video_id)
        try:
            transcript = transcript_list.find_transcript(['en'])
        except:
            transcript = transcript_list.find_transcript(['en-US', 'en-GB'])

        transcript_data = transcript.fetch()
        full_transcript = " ".join([item.text for item in transcript_data])
        video_info = get_video_info(video_id)

        return jsonify({
            "success": True,
            "video_id": video_id,
            "thumbnail": video_info["thumbnail"],
            "transcript": full_transcript,
            "transcript_segments": [{"text": item.text, "start": item.start, "duration": item.duration} for item in transcript_data]
        })
    except Exception as e:
        return jsonify({"error": f"Could not extract transcript: {str(e)}"}), 400

@app.route('/api/generate-notes', methods=['POST'])
def generate_notes():
    """Generate notes from transcript using Ollama"""
    data = request.get_json()
    transcript = data.get('transcript', '')

    if not transcript:
        return jsonify({"error": "Transcript is required"}), 400

    try:
        # Call Ollama API with Dynamic Model Detection
        active_model = get_ollama_model()
        response = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": active_model,
                "messages": [{
                    "role": "user",
                    "content": f"""You are an expert educator. Analyze the following video transcript and create comprehensive, well-structured study notes.
When explaining concepts that involve mathematical formulas, you MUST strictly use LaTeX notation. For BLOCK (display) math, use $$ ... $$ (e.g., $$E = mc^2$$). For INLINE math, use $ ... $ (e.g., $E = mc^2$). NEVER use parenthetical ( ... ) or bracketed [ ... ] math delimiters.

TRANSCRIPT:
{transcript[:8000]}

Create notes in the following structure:

## Summary
A brief 3-5 sentence overview of what this video covers.

## Key Points
- Point 1
- Point 2
- (List the most important takeaways)

## Important Concepts
For each concept, provide simple explanation.

## Detailed Notes
Break down the content into logical sections with explanations.

## Action Items
- What the viewer should do or remember

Make the notes clear, educational, and easy to study from."""
                }],
                "stream": False
            },
            timeout=120  # 2 minute timeout for longer transcripts
        )

        if response.status_code != 200:
            return jsonify({"error": f"Ollama API error: {response.text}. Model attempted: '{active_model}'."}), 500

        result = response.json()
        notes = result.get('message', {}).get('content', '')

        if not notes:
            return jsonify({"error": "No response from Ollama"}), 500

        return jsonify({"success": True, "notes": notes})
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": f"Connection Refused: Local Ollama server not detected. Steps to fix: \n1. Download/Open Ollama app from ollama.com.\n2. Run 'ollama serve' in your terminal.\n3. Verify http://localhost:11434/ loads correctly."
        }), 500
    except Exception as e:
        return jsonify({"error": f"Error generating notes: {str(e)}"}), 500

@app.route('/api/improve-notes', methods=['POST'])
def improve_notes():
    """Improve existing notes based on user instructions"""
    data = request.get_json()
    notes = data.get('notes', '')
    instructions = data.get('instructions', '')

    if not notes:
        return jsonify({"error": "Notes are required"}), 400

    try:
        # Call Ollama API with Dynamic Model Detection
        active_model = get_ollama_model()
        response = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": active_model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert academic tutor and educator. Your goal is to help the user fully understand educational concepts. You are provided with relevant context (notes or transcripts) from a specific video as an anchor. When answering questions, always weave in the context, BUT you MUST actively use your extensive internal knowledge to fill in educational gaps, explain related concepts (e.g., explaining Permutations even if the video only briefly mentions Probability), define terminology, and offer complete, deep conceptual explanations. Do not restrict your answers to only what is explicitly stated in the video. Additionally, when presenting mathematical formulas, you MUST strictly use LaTeX notation: use $$ ... $$ for display block math, and $ ... $ for inline math. Never use simple parentheses ( ... ) for mathematical expressions."
                    },
                    {
                        "role": "user",
                        "content": f"VIDEO CONTEXT / NOTES:\n{notes}\n\nUSER'S QUESTION:\n{instructions}"
                    }
                ],
                "stream": False
            },
            timeout=60
        )

        if response.status_code != 200:
            return jsonify({"error": f"Ollama API error: {response.text}. Model attempted: '{active_model}'."}), 500

        result = response.json()
        improved_notes = result.get('message', {}).get('content', '')

        if not improved_notes:
            return jsonify({"error": "No response from Ollama"}), 500

        return jsonify({"success": True, "improved_notes": improved_notes})
    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "Connection Refused: Local Ollama server is not active. Please run 'ollama serve' in terminal to proceed."
        }), 500
    except Exception as e:
        return jsonify({"error": f"Error improving notes: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)