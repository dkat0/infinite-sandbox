import os
import requests
from dotenv import load_dotenv

def create_runway_video(
    first_image_id=None,
    middle_image_id=None,
    last_image_id=None,
    text_prompt=None,
    aspect_ratio="landscape",
    seconds=5,
    camera_controls=None,
    seed=None,
    explore_mode=False
):
    """
    Create a video using Runway's Gen-3 Alpha Turbo API
    
    Args:
        first_image_id (str, optional): Asset ID for the first frame
        middle_image_id (str, optional): Asset ID for the middle frame
        last_image_id (str, optional): Asset ID for the last frame
        text_prompt (str, optional): Text description for the video
        aspect_ratio (str, optional): 'landscape' or 'portrait'
        seconds (int, optional): Video duration (5 or 10)
        camera_controls (dict, optional): Camera motion parameters
        seed (int, optional): Random seed for generation
        explore_mode (bool, optional): Whether to use explore mode
    """
    api_token = os.getenv('RUNWAY_API_TOKEN')
    if not api_token:
        raise ValueError("RUNWAY_API_TOKEN not found in environment variables")

    url = "https://api.useapi.net/v1/runwayml/gen3turbo/create"
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "aspect_ratio": aspect_ratio,
        "seconds": seconds,
        "exploreMode": explore_mode
    }

    # Add optional parameters if provided
    if first_image_id:
        payload["firstImage_assetId"] = first_image_id
    if middle_image_id:
        payload["middleImage_assetId"] = middle_image_id
    if last_image_id:
        payload["lastImage_assetId"] = last_image_id
    if text_prompt:
        payload["text_prompt"] = text_prompt
    if seed:
        payload["seed"] = seed

    # Add camera controls if provided
    if camera_controls:
        valid_controls = ["horizontal", "vertical", "roll", "zoom", "pan", "tilt", "static"]
        for control, value in camera_controls.items():
            if control in valid_controls:
                payload[control] = value

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()
    return response.json() 