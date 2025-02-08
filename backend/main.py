from openai import OpenAI
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from runwayml import RunwayML

load_dotenv()

# Get API key from env variables
OPENAI_API_KEY   = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL     = os.getenv('OPENAI_MODEL')
openai_client = OpenAI(api_key=OPENAI_API_KEY)

RUNWAYML_API_SECRET = os.getenv('RUNWAYML_API_SECRET')
runway_client = RunwayML()

def init_story(user_theme):
    prompt = f"""
    You are an AI Narration and Storyteller assistant. Create a narrative using the user provided theme, with either
    a cartoon or realistic style. To help yourself create this narrative, give an overview of it in 2-3 sentences. Now
    this narrative must end with the story being able to go in several directions, and explicitly state the next possible actions
    the users can take, like an interactive story. Additionally, create three image descriptions to showcase the scene over 10 seconds.
    It may have a consistent background and consistent characters.
    You will output only valid JSON—no extra keys, no Markdown formatting, and no disclaimers.
    Your JSON must have the following keys in the top-level object:
    1. storyline: String. This contains a text description of the storyline so far. 
    2. image_prompts: List of 3 Strings. Each is a prompt to DALLE, which will generate an image for part of the scene.
    3. video_generation_prompt: String. This prompt is to a video generation model which will be fed the 3 images, and this text to create the video.
    4. narration: A textual narration which will be used as closed captioning and be read aloud along the video.
    5. actions: List of 2-4 Strings, possible actions for the user to take
    Output must be valid JSON with exactly these keys.

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
    past_storyline=None
):
    prompt = f"""
    You are an AI Narration and Storyteller assistant. Create the next scene based on the past storyline. The user chooses to take the action listed below. To help yourself create this narrative,
    give an overview of it in 2-3 sentences. Now this narrative must end with the story being able to go in several directions, and
    explicitly state the next possible actions the users can take, like an interactive story. Additionally, create three image descriptions to showcase the scene over 10 seconds.
    It may have a consistent background and consistent characters.
    You will output only valid JSON—no extra keys, no Markdown formatting, and no disclaimers.
    Your JSON must have the following keys in the top-level object:
    1. storyline: String. This contains a text description of the storyline so far. 
    2. image_prompts: List of 3 Strings. Each is a prompt to DALLE, which will generate an image for part of the scene.
    3. video_generation_prompt: String. This prompt is to a video generation model which will be fed the 3 images, and this text to create the video.
    4. narration: A textual narration which will be used as closed captioning and be read aloud along the video.
    5. actions: List of 2-4 Strings, possible actions for the user to take
    Output must be valid JSON with exactly these keys.

    Past Storyline:
    {past_storyline}

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
    except json.JSONDecodeError:
        # Fallback: If something goes wrong with JSON parsing,
        # you might want to handle errors or retry.
        result_json = {}
    
    return result_json


def generate_single_image(prompt, image_size="1024x1024"):
    """
    Generate a single image using the DALL·E API.
    """
    try:
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=image_size,
            quality="standard",
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

def generate_video(image_urls, video_generation_prompt):
    # Create a new image-to-video task using the "gen3a_turbo" model
    task = runway_client.image_to_video.create(
        model='gen3a_turbo',
        prompt_images=[{"uri": image_urls[0], "position": "first"},
                       {"uri": image_urls[1], "position": "first"}, # not sure??
                       {"uri": image_urls[2], "position": "last"}],
        prompt_text=video_generation_prompt
    )
    task_id = task.id

    # Poll the task until it's complete
    time.sleep(10)  # Wait for a second before polling
    task = client.tasks.retrieve(task_id)
    while task.status not in ['SUCCEEDED', 'FAILED']:
        time.sleep(10)  # Wait for ten seconds before polling
        task = client.tasks.retrieve(task_id)

    print('Task complete:', task)
    return task

if __name__ == "__main__":
    theme = "sci-fi bounty hunter story set on an alien planet, realistic style"
    print(theme)

    generated_part = init_story(user_theme=theme)

    print(json.dumps(generated_part, indent=2))

    # Step 2: Generate images for the initial story using the DALL·E API
    if "image_prompts" in generated_part and len(generated_part["image_prompts"]) == 3:
        images = generate_images_parallel(generated_part["image_prompts"])
        print("\nGenerated Image URLs:")
        for idx, url in enumerate(images, start=1):
            print(f"Image {idx}: {url}")
        
        video = generate_video(images, generated_part["video_generation_prompt"])
    else:
        print("No valid image prompts found in the generated part.")
    
    """
    next_action = generated_part["actions"][0]
    second_part = generate_story_part(next_action, past_storyline=generated_part["storyline"])
    
    print(json.dumps(second_part, indent=2))

    # Optionally generate images for the next story part as well
    if "image_prompts" in second_part and len(second_part["image_prompts"]) == 3:
        images2 = generate_images_parallel(second_part["image_prompts"])
        print("\nGenerated Image URLs for Second Part:")
        for idx, url in enumerate(images2, start=1):
            print(f"Image {idx}: {url}")
        
        video = generate_video(images2, generated_part["video_generation_prompt"])
    else:
        print("No valid image prompts found in the second story part.")

    # You would then:
    # 1) Feed generated_part["image_prompts"] into DALL·E to get 3 images.
    # 2) Feed the images + generated_part["video_generation_prompt"] into Runway.
    # 3) Use generated_part["narration"] for TTS.
    # 4) Display the final video + next actions to the user.
"""