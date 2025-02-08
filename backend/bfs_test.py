import requests
import time
import json
import uuid
import os
from collections import deque

# Base URL for your Flask API
API_BASE_URL = "https://infinite-sandbox.onrender.com/"
# Adjust the polling interval (seconds) as needed.
POLL_INTERVAL = 5

def poll_story_status(story_id, poll_interval=POLL_INTERVAL):
    """
    Poll the /story_status/<story_id> endpoint until the story's status is "completed".
    Returns the complete story data.
    """
    while True:
        try:
            response = requests.get(f"{API_BASE_URL}/story_status/{story_id}")
            data = response.json()
        except Exception as e:
            print(f"Error polling status for story_id {story_id}: {e}")
            time.sleep(poll_interval)
            continue

        if data.get("status") == "completed":
            return data
        time.sleep(poll_interval)

def initialize_story(user_theme):
    """
    Calls /initialize with the given theme, polls until the initial scene is complete,
    and returns a tuple (story_id, scene_data).
    """
    print("Initializing story...")
    response = requests.post(f"{API_BASE_URL}/initialize", json={"user_theme": user_theme})
    data = response.json()
    story_id = data["story_id"]
    scene_data = poll_story_status(story_id)
    print(f"Initial scene complete. Story ID: {story_id}")
    return story_id, scene_data

def next_scene(story_id, user_action):
    """
    Calls /next_scene with the given story_id and user_action,
    then polls until the new scene is complete.
    Returns the updated scene data.
    """
    print(f"Requesting next scene with action: {user_action}")
    response = requests.post(
        f"{API_BASE_URL}/next_scene",
        json={"story_id": story_id, "user_action": user_action}
    )
    # The story_id remains the same in the current API.
    scene_data = poll_story_status(story_id)
    print(f"Scene update complete for action: {user_action}")
    return scene_data

def save_tree(tree, filename="full_story_tree_bfs.json"):
    """
    Save the current story tree to disk.
    """
    os.makedirs(os.path.dirname(filename) or ".", exist_ok=True)
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(tree, f, indent=2)
    print(f"Saved tree to {filename}")

def generate_full_tree_bfs(user_theme, max_depth=5):
    """
    Pre-generates the full story tree for a given theme using BFS.
    For each node, it calls /next_scene for every available action.
    After processing each node (or level), the current tree is saved to disk.
    
    The tree structure is a nested dict:
      - Each node contains:
            { "story_id": <str>,
              "data": <scene_data from API>,
              "branches": { action1: <node>, action2: <node> }
            }
    """
    # 1. Generate the initial scene.
    root_story_id, init_scene = initialize_story(user_theme)
    # The root node.
    tree = {
        "story_id": root_story_id,
        "data": init_scene,
        "branches": {}
    }
    
    # Queue for BFS; each item is a tuple (node, current_depth)
    queue = deque()
    queue.append((tree, 1))
    
    while queue:
        node, depth = queue.popleft()
        if depth > max_depth:
            continue

        # Extract available actions from the current node.
        # (In our API, the actions are contained in the "result" key of the scene data.)
        actions = node.get("data", {}).get("result", {}).get("actions", [])
        print(f"Processing node at depth {depth} with actions: {actions}")

        # For each action, generate the next scene.
        for action in actions:
            try:
                new_scene = next_scene(node["story_id"], action)
            except Exception as e:
                print(f"Error generating next scene for action '{action}' at depth {depth}: {e}")
                continue
            
            # Simulate a branch-specific story id.
            branch_story_id = str(uuid.uuid4())
            branch_node = {
                "story_id": branch_story_id,
                "data": new_scene,
                "branches": {}
            }
            # Save the branch under the current node keyed by the action.
            node.setdefault("branches", {})[action] = branch_node
            # Add the new branch to the BFS queue if we haven't reached max_depth.
            if depth < max_depth:
                queue.append((branch_node, depth + 1))
        
        # Save progress after processing each node.
        save_tree(tree)
    
    return tree

if __name__ == "__main__":
    # Fixed theme to pre-generate the story tree.
    theme = "A mysterious enchanted forest where magic and mystery abound."
    # Set the maximum depth (e.g., 5 levels deep).
    full_tree = generate_full_tree_bfs(theme, max_depth=5)
    print("Full story tree generated.")
