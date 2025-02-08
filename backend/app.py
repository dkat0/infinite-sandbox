from flask import Flask, request, jsonify
import json
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
import base64

# Import your API clients and helper functions.
from openai import OpenAI
from elevenlabs.client import ElevenLabs
from elevenlabs import play
from runway import RunwayUnofficial

import threading

load_dotenv()

app = Flask(__name__)

# ----------------------------
# Global in‑memory story state.
stories = {}

# ----------------------------
# Setup API clients using environment variables.
OPENAI_API_KEY   = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL     = os.getenv('OPENAI_MODEL')
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# For video generation – choose your preferred runway client.
runway_client = RunwayUnofficial()

ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

# ----------------------------
# Helper Functions (adapted from your code)
def init_story(user_theme):
    prompt = f"""
    You are an AI Narration and Storyteller assistant. Create a narrative using the user provided theme, with either a cartoon or realistic style. To help yourself create this narrative, give an overview of it in 2-3 sentences. Now this narrative must end with the story being able to go in several directions, and explicitly state the next possible actions the users can take, like an interactive story.

    Additionally, create three image descriptions to showcase the scene over 10 seconds. When crafting these image descriptions, follow these important guidelines to ensure consistency across all images:
    1. **Consistent Core Details:** Use the exact same core character description and style attributes for every image prompt. Only modify the scenario portion to depict different dynamic actions or emotions.
    2. **Active, Full-Body Poses:** Use dynamic, active verbs in each scenario so that the character is depicted in full-body action poses rather than static or close-up shots.
    3. **Uniform Background and Style:** Keep the background and overall visual style (digital painting, gradient shading, clean linework, vibrant palette, stylized proportions) consistent throughout the three prompts.
    4. **Exact Template Usage:** Always use a consistent template for the core character and style. For example, you might use the following template:
       "Digital painting of a distinctly feminine green-eyed, white-furred tabaxi monk (with fluffy cheeks and a tuft on her head) with gradient shading, clean linework, vibrant palette, and stylized proportions. Wearing a simple green monk tunic and carrying a pack, [scenario]"
       **Important:** This tabaxi monk example is provided solely as an example. You may choose a different character description if it better fits your narrative, but whichever core character you choose must remain exactly the same across all three image prompts.
       Replace "[scenario]" with a brief description that always includes:
         - a specific setting,
         - a dynamic action (using strong, active verbs), and
         - an emotion that the character is expressing.

    Additionally, include a new key "core_details" in your JSON output. This key should contain the exact string used to define the core character and style (i.e. the part before the [scenario]). This value will be used by later scenes to ensure consistency.

    You will output only valid JSON—no extra keys, no Markdown formatting, and no disclaimers.
    Your JSON must have the following keys in the top-level object:
    1. storyline: String. This contains a text description of the storyline so far.
    2. image_prompts: List of 3 Strings. Each is a prompt to DALLE, which will generate an image for part of the scene.
    3. video_generation_prompt: String. This prompt is to a video generation model which will be fed the 3 images, and this text to create the video. (no need to mention here that the video should be 10 seconds). Keep it concise.
    4. narration: A textual narration which will be used as closed captioning and be read aloud along the video. 2 short sentences max (to fit in 10 sec video).
    5. actions: List of 2 Strings, which are two possible actions for the user to take.
    6. core_details: String. The core character and style template to be used for all image prompts in subsequent scenes.

    Output must be valid JSON with exactly these keys.

    Note for the image descriptions: you should not depict any extreme violence/weapons/gore etc. as to not get blocked by content moderation filters. Also, remember that the 3 images must be of similar scenes (not drastically different) to smoothly transition the narrative. Consistency is key—keep the character’s appearance and the background uniform.

    User Provided Theme: {user_theme}
    """
    user_message = {
        "role": "user",
        "content": prompt
    }

    response = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[user_message],
    )
    assistant_reply = response.choices[0].message.content.strip()

    try:
        result_json = json.loads(assistant_reply)
    except json.JSONDecodeError:
        result_json = {}
    return result_json


def generate_story_part(user_action, last_image_prompt, storyline, core_details):
    prompt = f"""
    You are an AI Narration and Storyteller assistant. Create the next scene based on the past storyline and the core character details provided. The user has chosen the following action:
    {user_action}

    Please provide an overview of the new scene in 2-3 sentences. At the end of your scene, clearly list two possible actions that the user can take next.

    IMPORTANT FOR IMAGE GENERATION:
    - The video for the new scene will be generated from three images.
    - The **first image** is already provided from the previous scene. Its prompt was:
         "{last_image_prompt}"
    - Please **do not** generate a new prompt for this first image.
    - Instead, generate exactly **two new image prompts** for the current scene that continue the narrative.
    - Ensure that the two new image prompts have consistent style with the previous scene.

    Also, provide a concise video generation prompt that instructs a video generation model to produce a 10-second video using the three images (in the following order: first image from previous scene, then the two new images).

    You will output only valid JSON—no extra keys, no Markdown formatting, and no disclaimers.
    Your JSON must have the following keys:
    1. new_storyline: String. A text description of solely the new content of the storyline.
    2. image_prompts: List of 2 Strings. Each is a prompt to DALLE for generating a new image.
    3. video_generation_prompt: String. This prompt is to a video generation model which will be fed the 3 images, and this text to create the video. (no need to mention here that the video should be 10 seconds). Keep it concise.
    4. narration: A textual narration which will be used as closed captioning and be read aloud along the video (2 short sentences max)
    5. actions: List of 2 Strings, which are two possible actions for the user to take.
    6. core_details: String. An updated version of the core character and style template if needed.
    """

    user_message = {
        "role": "user",
        "content": prompt
    }
    response = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[user_message],
    )
    assistant_reply = response.choices[0].message.content.strip()

    try:
        result_json = json.loads(assistant_reply)
        # Append the new storyline to the previous storyline.
        result_json["storyline"] = storyline + "\n" + result_json.get("new_storyline", "")
    except json.JSONDecodeError:
        result_json = {}
    return result_json


def generate_single_image(prompt, image_size="1792x1024"):
    try:
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=image_size,
            quality="hd",
            n=1
        )
        return response.data[0].url
    except Exception as e:
        print(f"Error generating image for prompt '{prompt}': {e}")
        return None


def generate_images_parallel(image_prompts, image_size="1792x1024"):
    image_urls = []
    with ThreadPoolExecutor(max_workers=len(image_prompts)) as executor:
        future_to_prompt = {
            executor.submit(generate_single_image, prompt, image_size): prompt
            for prompt in image_prompts
        }
        for future in as_completed(future_to_prompt):
            prompt = future_to_prompt[future]
            try:
                image_url = future.result()
                image_urls.append(image_url)
            except Exception as exc:
                print(f"Image generation for prompt '{prompt}' generated an exception: {exc}")
                image_urls.append(None)
    return image_urls


def generate_narration(text):
    voices = {
        "michael": "uju3wxzG5OhpWcoi3SMy", # narrative
        "brittney": "pjcYQlDFKMbcOUp6F5GD", # narrative
        "dallin": "alFofuDn3cOwyoz1i44T", # narrative
        "soothingguy": "pVnrL6sighQX7hVz89cp", # narrative
        "guy3": "15CVCzDByBinCIoCblXo",
        "jerry": "XA2bIQ92TabjGbpO2xRr",
        "samara": "19STyYD15bswVz51nqLf",
        "grandpa": "NOpBlnGInO9m6vDvFkFC",
        "mark": "UgBBYS2sOqTuMpoF3BR0",
    }
    
    audio = elevenlabs_client.text_to_speech.convert(
        text=text,
        voice_id=voices["michael"],
        model_id="eleven_multilingual_v2",  # choose model as required
        output_format="mp3_44100_128",
    )

    #play(audio)
    audio_bytes = b''.join(list(audio))
    # Convert bytes to base64 string for JSON serialization
    return base64.b64encode(audio_bytes).decode('utf-8')

def process_story(story_id, user_theme=None, user_action=None):
    """
    Returns JSON with keys:
       - story_id: a unique identifier for subsequent calls.
       - video: the generated video (e.g. URL or base64 encoded data)
       - narration_audio: the narration audio (e.g. URL or binary data)
       - narration_text: the narration text (for captions)
       - actions: a list of two possible next actions.
    """
    try:
        if user_theme:
            # This is an initialization process.
            print("Generating story...")
            generated_story = init_story(user_theme)
            if not generated_story:
                stories[story_id]['status'] = 'error'
                return
            print(generated_story)
            
            if "image_prompts" not in generated_story or len(generated_story["image_prompts"]) != 3:
                stories[story_id]['status'] = 'error'
                return

            print("Generating images...")
            images = generate_images_parallel(generated_story["image_prompts"])
            print("Generating video...")
            video = runway_client.generate_video(images, generated_story.get("video_generation_prompt"))
            print("Generating narration...")
            narration_audio = generate_narration(generated_story["narration"])
            narration_text = generated_story["narration"]
            actions = generated_story.get("actions", [])


            last_image_prompt = generated_story["image_prompts"][-1]
            last_image_url = images[-1]

            # Update story details.
            stories[story_id].update({
                "status": "completed",
                "result": {
                    "video": video,
                    "narration_audio": narration_audio,
                    "narration_text": narration_text,
                    "actions": actions,
                },
                "storyline": generated_story.get("storyline", ""),
                "core_details": generated_story.get("core_details", ""),
                "last_image_prompt": last_image_prompt,
                "last_image_url": last_image_url,
            })
        else:
            # This is for generating the next scene.
            current_context = stories[story_id]
            current_storyline = current_context.get("storyline", "")
            current_core_details = current_context.get("core_details", "")
            previous_last_image_prompt = current_context.get("last_image_prompt", "")
            previous_last_image_url = current_context.get("last_image_url", "")

            print("Generating next story part...")
            new_story = generate_story_part(
                user_action,
                storyline=current_storyline,
                core_details=current_core_details,
                last_image_prompt=previous_last_image_prompt
            )
            print(new_story)

            if not new_story or "image_prompts" not in new_story or len(new_story["image_prompts"]) != 2:
                stories[story_id]['status'] = 'error'
                return

            print("Generating images...")
            new_image_urls = generate_images_parallel(new_story["image_prompts"])
            print("Generating video...")
            combined_images = [previous_last_image_url] + new_image_urls
            video = runway_client.generate_video(combined_images, new_story.get("video_generation_prompt"))
            print("Generating narration...")
            narration_audio = generate_narration(new_story["narration"])
            narration_text = new_story["narration"]

            actions = new_story.get("actions", [])

            new_last_image_prompt = new_story["image_prompts"][-1]
            new_last_image_url = new_image_urls[-1]

            stories[story_id].update({
                "status": "completed",
                "result": {
                    "video": video,
                    "narration_audio": narration_audio,
                    "narration_text": narration_text,
                    "actions": actions,
                },
                "storyline": new_story.get("storyline", ""),
                "core_details": new_story.get("core_details", ""),
                "last_image_prompt": new_last_image_prompt,
                "last_image_url": new_last_image_url,
            })
    except Exception as e:
        print(f"Error processing story {story_id}: {e}")
        stories[story_id]['status'] = 'error'

# ----------------------------
# Flask Endpoints

@app.route('/initialize', methods=['POST'])
def initialize():
    data = request.get_json()
    if not data or 'user_theme' not in data:
        return jsonify({'error': 'Missing user_theme in request body'}), 400

    user_theme = data['user_theme']
    story_id = str(uuid.uuid4())
    # Initialize story status as 'processing'
    stories[story_id] = {"status": "processing"}

    # Launch background processing (using a thread for this example)
    threading.Thread(target=process_story, args=(story_id, user_theme, None)).start()

    # Return the story_id immediately.
    return jsonify({"story_id": story_id, "status": "processing"})

@app.route('/next_scene', methods=['POST'])
def next_scene():
    data = request.get_json()
    if not data or 'story_id' not in data or 'user_action' not in data:
        return jsonify({'error': 'Missing story_id or user_action in request body'}), 400

    story_id = data['story_id']
    user_action = data['user_action']

    if story_id not in stories:
        return jsonify({'error': 'Invalid story_id'}), 400

    # Mark the story as processing the next scene.
    stories[story_id]['status'] = "processing"
    threading.Thread(target=process_story, args=(story_id, None, user_action)).start()

    return jsonify({"story_id": story_id, "status": "processing"})

@app.route('/story_status/<story_id>', methods=['GET'])
def story_status(story_id):
    if story_id not in stories:
        return jsonify({'error': 'Invalid story_id'}), 400

    story_data = stories[story_id]
    return jsonify({
        "status": story_data.get("status", "unknown"),
        "result": story_data.get("result", {})
    })

# -------------------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)