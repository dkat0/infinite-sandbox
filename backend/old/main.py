from openai import OpenAI
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs import play
import requests
import io
import time
from runway import RunwayClient, RunwayUnofficial

load_dotenv()

# Get API key from env variables
OPENAI_API_KEY   = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL     = os.getenv('OPENAI_MODEL')
openai_client = OpenAI(api_key=OPENAI_API_KEY)

#runway_client = RunwayClient()
runway_client = RunwayUnofficial()

ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')
elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

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
    3. video_generation_prompt: String. This prompt is to a video generation model which will be fed the 3 images, and this text to create the video. (no need to mention the desired length of video, automatically 10 seconds). Keep it concise.
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

    # 2) Call the chat completion endpoint, can tune temperature maybe?
    response = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[user_message],
    )
    
    # 3) Extract the response content (should be a JSON string)
    assistant_reply = response.choices[0].message.content.strip()
    
    # 4) Parse it as JSON
    try:
        result_json = json.loads(assistant_reply)
    except json.JSONDecodeError:
        # Fallback: If something goes wrong with JSON parsing,
        # you might want to handle errors or retry.
        result_json = {}
    
    return result_json


def generate_story_part(
    user_action,
    last_image=None,
    storyline=None,
    core_details=None
):
    prompt = f"""
    You are an AI Narration and Storyteller assistant. Create the next scene based on the past storyline and the core character details provided. The user chooses to take the action listed below. To help yourself create this narrative, give an overview of it in 2-3 sentences. Now this narrative must end with the story being able to go in several directions, and explicitly state the next possible actions for the user to take, like an interactive story.

    Additionally, create three image descriptions to showcase the scene over 10 seconds. When crafting these image descriptions, follow these guidelines to ensure consistency with previous scenes:
    - Use the core character description and style attributes provided below as the basis for your image prompts.
    - You may make slight modifications to these details if necessary for the narrative progression, but the overall vibe should remain consistent.
    - Only modify the scenario portion of the prompts to depict new dynamic actions and emotions.
    - Keep the background and overall visual style uniform.
    - The core character and style details provided are: {core_details}

    Additionally, include an updated version of the core character details in a new key "updated_core_details". This updated value should reflect any subtle modifications needed to smoothly flow with the new scene while still matching the established vibe.

    You will output only valid JSON—no extra keys, no Markdown formatting, and no disclaimers.
    Your JSON must have the following keys in the top-level object:
    1. new_storyline: String. This contains a text description of solely the new content of the storyline.
    2. image_prompts: List of 3 Strings. Each is a prompt to DALLE, which will generate an image for part of the scene.
    3. video_generation_prompt: String. This prompt is to a video generation model which will be fed the 3 images, and this text to create the video. (no need to mention the desired length of video, automatically 10 seconds). Keep it concise.
    4. narration: A textual narration which will be used as closed captioning and be read aloud along the video. (2 short sentences max)
    5. actions: List of 2 Strings, which are two possible actions for the user to take.
    6. core_details: String. An updated version of the core character and style template based on the previous details, with only subtle modifications if needed.

    Note for the image descriptions: you should not depict any extreme violence/weapons/gore etc. as to not get blocked by content moderation filters. Also, the 3 images must be of similar scenes to smoothly transition the narrative.

    Storyline So Far:
    {storyline}

    User Action:
    {user_action}
    """

    user_message = {
        "role": "user",
        "content": prompt
    }

    # 2) Call the chat completion endpoint, can tune temperature maybe?
    response = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[user_message],
    )
    
    # 3) Extract the response content (should be a JSON string)
    assistant_reply = response.choices[0].message.content.strip()
    
    # 4) Parse it as JSON
    try:
        result_json = json.loads(assistant_reply)
        result_json["storyline"] = storyline + "\n" + result_json["new_storyline"]
    except json.JSONDecodeError:
        # Fallback: If something goes wrong with JSON parsing,
        # you might want to handle errors or retry.
        result_json = {}
    
    return result_json


def generate_single_image(prompt, image_size="1792x1024"):
    """
    Generate a single image using the DALL·E API.
    """
    try:
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=image_size,
            quality="hd", # or hd
            n=1
        )
        # Extract and return the URL of the generated image
        return response.data[0].url
    except Exception as e:
        print(f"Error generating image for prompt '{prompt}': {e}")
        return None

def generate_images_parallel(image_prompts, image_size="1024x1024"):
    """
    Given a list of image prompt strings, generate images in parallel.
    Returns a list of image URLs.
    """
    image_urls = []
    # Use a thread pool with a worker for each prompt
    with ThreadPoolExecutor(max_workers=len(image_prompts)) as executor:
        # Submit each image generation task to the executor
        future_to_prompt = {
            executor.submit(generate_single_image, prompt, image_size): prompt
            for prompt in image_prompts
        }
        # As each future completes, collect its result.
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
        model_id="eleven_multilingual_v2", # eleven_multilingual_v2 / eleven_flash_v2_5
        output_format="mp3_44100_128",
    )
    #audio_bytes = b''.join(list(audio))
    audio_bytes = None
    play(audio)
    return audio_bytes

def main():
    t1 = time.time()
    #theme = "sci-fi bounty hunter story set on an alien planet, realistic style"
    #theme = "george washington in revolutionary war"
    #theme = "minions on a day off of work"
    #theme = "puss and boots the movie, having fun"
    theme = "scifi story about a robot who is sent back in time to change the course of history"
    print(theme)

    generated_part = init_story(user_theme=theme)

    print(json.dumps(generated_part, indent=2))

    # Step 2: Generate images for the initial story using the DALL·E API
    if not ("image_prompts" in generated_part and len(generated_part["image_prompts"]) == 3):
        print("No valid image prompts found in the generated part.")
        return
    
    images = generate_images_parallel(generated_part["image_prompts"])
    print("\nGenerated Image URLs:")
    for idx, url in enumerate(images, start=1):
        print(f"Image {idx}: {url}")
    
    #video_prompt = generated_part["video_generation_prompt"]
    video_prompt = None
    video = runway_client.generate_video(images, video_prompt)

    print("Generating audio...")
    narration_audio = generate_narration(generated_part["narration"])
    print("done. generating next story part")

    print("Took " + str(round(time.time() - t1, 2)) + " seconds.")

    next_action = generated_part["actions"][0]
    second_part = generate_story_part(next_action, past_storyline=generated_part["storyline"], core_details=generated_part["core_details"])
    
    print(json.dumps(second_part, indent=2))

    # Optionally generate images for the next story part as well
    if "image_prompts" in second_part and len(second_part["image_prompts"]) == 3:
        images2 = generate_images_parallel(second_part["image_prompts"])
        print("\nGenerated Image URLs for Second Part:")
        for idx, url in enumerate(images2, start=1):
            print(f"Image {idx}: {url}")
        
        video = runway_client.generate_video(images2, generated_part["video_generation_prompt"])
    else:
        print("No valid image prompts found in the second story part.")

if __name__ == "__main__":
    main()
