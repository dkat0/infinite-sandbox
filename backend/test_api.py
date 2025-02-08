import time
import requests
import json

BASE_URL = "http://localhost:5000"

def poll_status(story_id, poll_interval=5):
    """
    Poll the /story_status/<story_id> endpoint every poll_interval seconds
    until the story status becomes "completed" or "error".
    """
    status_url = f"{BASE_URL}/story_status/{story_id}"
    while True:
        try:
            response = requests.get(status_url)
            response.raise_for_status()
        except Exception as e:
            print(f"Error polling status: {e}")
            time.sleep(poll_interval)
            continue

        data = response.json()
        status = data.get("status", "unknown")
        print(f"Polling status for story_id {story_id}: {status}")

        if status == "completed":
            return data.get("result")
        elif status == "error":
            print("Error occurred during processing.")
            return None

        time.sleep(poll_interval)

def test_initialize():
    """
    Test the /initialize endpoint by sending a sample theme.
    Poll for completion and return the story_id and final result.
    """
    print("Testing /initialize endpoint...")
    init_url = f"{BASE_URL}/initialize"
    #theme = "A futuristic adventure in space"
    theme = input("Enter a theme for the story: ")
    payload = {"user_theme": theme}
    try:
        response = requests.post(init_url, json=payload)
        response.raise_for_status()
    except Exception as e:
        print("Error calling /initialize:", e)
        return None

    init_data = response.json()
    print("Initialize response:", json.dumps(init_data, indent=2))

    story_id = init_data.get("story_id")
    if not story_id:
        print("No story_id returned from /initialize.")
        return None

    # Poll for processing to complete.
    result = poll_status(story_id)
    if result is None:
        print("Story processing failed during initialization.")
        return None

    print("Final result from /initialize:")
    print(json.dumps(result, indent=2))
    return story_id, result

def test_next_scene(story_id, chosen_action):
    """
    Test the /next_scene endpoint by sending the chosen action.
    Poll for processing to complete and return the final result.
    """
    print("\nTesting /next_scene endpoint...")
    next_scene_url = f"{BASE_URL}/next_scene"
    payload = {
        "story_id": story_id,
        "user_action": chosen_action
    }
    try:
        response = requests.post(next_scene_url, json=payload)
        response.raise_for_status()
    except Exception as e:
        print("Error calling /next_scene:", e)
        return None

    next_data = response.json()
    print("Next scene initiation response:", json.dumps(next_data, indent=2))

    # Poll for the next scene processing to complete.
    result = poll_status(story_id)
    if result is None:
        print("Story processing failed during next scene generation.")
        return None

    print("Final result from /next_scene:")
    print(json.dumps(result, indent=2))
    return result

def main():
    # Test the initialization of the story.
    init_result = test_initialize()
    if not init_result:
        return

    story_id, init_data = init_result
    actions = init_data.get("actions", [])
    if not actions:
        print("No actions available from initialization result.")
        return

    # Choose the first available action for the next scene.
    chosen_action = actions[0]
    print(f"\nChosen action for next scene: {chosen_action}")
    next_scene_result = test_next_scene(story_id, chosen_action)
    if not next_scene_result:
        print("Next scene test failed.")
        return

if __name__ == "__main__":
    main()