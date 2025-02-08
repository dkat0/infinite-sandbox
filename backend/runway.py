import os
import requests
from dotenv import load_dotenv
from runwayml import RunwayML
import time
import json
from PIL import Image
import io

load_dotenv()

RUNWAYML_API_SECRET = os.getenv('RUNWAYML_API_SECRET')
USEAPI_API_KEY = os.getenv('USEAPI_API_KEY')
RUNWAY_EMAIL = os.getenv('RUNWAY_EMAIL')


RUNWAY_PASSWORD = os.getenv('RUNWAY_PASSWORD')

class RunwayClient:
    def __init__(self):
        self.runway_client = RunwayML()
        
    def generate_video(self, image_urls, video_generation_prompt):
        # Create a new image-to-video task using the "gen3a_turbo" model
        task = self.runway_client.image_to_video.create(
            model='gen3a_turbo',
            prompt_image=[{"uri": image_urls[0], "position": "first"},
                        {"uri": image_urls[2], "position": "last"}],
            prompt_text=video_generation_prompt,
            duration=10,
            ratio="1280:768",
            watermark=False
        )
        task_id = task.id
        print(task_id)

        # Poll the task until it's complete
        time.sleep(10)  # Wait for a second before polling
        task = self.runway_client.tasks.retrieve(task_id)
        while task.status not in ['SUCCEEDED', 'FAILED']:
            time.sleep(2)  # Wait for ten seconds before polling
            task = self.runway_client.tasks.retrieve(task_id)

        print('Task complete:', task)
        print(task.output)
        return task

class RunwayUnofficial:
    def __init__(self):
        self.base_url = "https://api.useapi.net/v1/runwayml"
        self.headers = {
            "Authorization": f"Bearer {USEAPI_API_KEY}",
            "Content-Type": "application/json"
        }
        self.token_file = ".runway_token"
        self.token = self._load_token()
        if not self.token:
            self._authenticate()

    def _load_token(self):
        try:
            if os.path.exists(self.token_file):
                with open(self.token_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load token: {str(e)}")
        return None

    def _save_token(self, token):
        try:
            directory = os.path.dirname(os.path.abspath(self.token_file))
            os.makedirs(directory, exist_ok=True)
            
            with open(self.token_file, 'w') as f:
                json.dump(token, f)
        except Exception as e:
            print(f"Warning: Could not save token to file: {str(e)}")

    def _authenticate(self):
        payload = {
            "email": RUNWAY_EMAIL,
            "password": RUNWAY_PASSWORD,
            "maxJobs": 5,
        }
        
        r = requests.post(
            f"{self.base_url}/accounts/{RUNWAY_EMAIL}", 
            headers=self.headers, 
            json=payload
        )
        try:
            self.token = r.json()['jwt']  # This is a dictionary
            if "token" not in self.token:
                raise Exception("Token not found in response")
            self._save_token(self.token)
        except Exception as e:
            print(f"Error: {e}, {r.text}")

    def _get_content_type(self, filename):
        ext = filename.lower().split('.')[-1]
        content_types = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'mp4': 'video/mp4'
        }
        return content_types.get(ext, 'image/png')


    def _upload_image(self, image_url):
        print("Uploading image")
        # First download the image from the URL
        image_response = requests.get(image_url)
        if image_response.status_code != 200:
            raise Exception(f"Failed to download image from {image_url}")
        
        # Display the image using PIL
        #image = Image.open(io.BytesIO(image_response.content))
        #image.show()

        # Get filename from URL and determine content type
        filename = image_url.split("?")[0].split("/")[-1]
        content_type = self._get_content_type(filename)

        upload_headers = {
            "Authorization": f"Bearer {USEAPI_API_KEY}",
            "Content-Type": content_type
        }
        url = f"{self.base_url}/assets/?name={filename.split('.')[0]}"
        #print(url)
        #print(upload_headers)
        response = requests.post(
            url,
            headers=upload_headers,
            data=image_response.content,
        )

        if response.status_code != 200:
            raise Exception(f"Failed to upload image: {response.text}")
            
        return response.json()['assetId']

    def generate_video(self, image_urls, video_generation_prompt):
        # Upload all images and get their asset IDs
        asset_ids = []
        for url in image_urls:
            asset_id = self._upload_image(url)
            asset_ids.append(asset_id)

        # Prepare the video generation payload
        payload = {
            "firstImage_assetId": asset_ids[0],
            "middleImage_assetId": asset_ids[1] if len(asset_ids) > 2 else None,
            "lastImage_assetId": asset_ids[-1],
            "text_prompt": video_generation_prompt,
            "aspect_ratio": "landscape",
            "seconds": 10,
            "maxJobs": 5
        }

        # Create the video generation task
        response = requests.post(
            f"{self.base_url}/gen3turbo/create",
            headers=self.headers,
            json=payload
        )
        if response.status_code != 200:
            raise Exception(f"Failed to create video generation task: {response.text}")

        task_id = response.json()['taskId']
        print(f"Task created: {task_id}")

        # Poll for task completion
        while True:
            task_response = requests.get(
                f"{self.base_url}/tasks/{task_id}",
                headers=self.headers
            )
            task_data = task_response.json()
            
            if task_data['status'] == 'SUCCEEDED':
                print(task_data)
                # Return the video URL from artifacts
                if task_data['artifacts'] and len(task_data['artifacts']) > 0:
                    return task_data['artifacts'][0]['url']
                raise Exception("No video URL found in completed task")
            
            elif task_data['status'] == 'FAILED':
                raise Exception(f"Task failed: {task_data.get('error')}")
            
            time.sleep(1.5)  # Wait before polling again

