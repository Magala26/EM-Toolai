#!/usr/bin/env python3
import requests
import json
import uuid
import time
import pytest
import os
from typing import Dict, List, Any

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1].strip('"\'')
            break

# Ensure the backend URL is set
if not BACKEND_URL:
    raise ValueError("BACKEND_URL not found in frontend/.env")

# Add /api prefix to all endpoints
API_URL = f"{BACKEND_URL}/api"

print(f"Testing backend API at: {API_URL}")

# Test data
test_user = {
    "email": f"test-user-{uuid.uuid4()}@example.com",
    "name": "Test User"
}

test_questionnaire = {
    "position": "Financial Analyst",
    "use_case": "Quarterly financial reporting and data visualization",
    "budget": "$5,000 - $10,000 per year",
    "company_size": "Medium (100-500 employees)",
    "data_types": ["Excel spreadsheets", "CSV files", "SQL databases"],
    "integration_needs": "Need to connect to our SQL Server database and export to PowerPoint",
    "team_size": "5-10 people"
}

# Helper functions
def create_test_user() -> Dict[str, Any]:
    """Create a test user and return the user data"""
    response = requests.post(f"{API_URL}/users", json=test_user)
    assert response.status_code == 200, f"Failed to create test user: {response.text}"
    return response.json()["user"]

def test_root_endpoint():
    """Test the root endpoint"""
    print("\n🧪 Testing root endpoint...")
    response = requests.get(BACKEND_URL)
    assert response.status_code == 200, f"Root endpoint failed: {response.text}"
    assert "message" in response.json(), "Root endpoint response missing 'message' field"
    print("✅ Root endpoint test passed")

def test_questionnaire_endpoint():
    """Test the questionnaire endpoint for AI recommendations"""
    print("\n🧪 Testing questionnaire endpoint...")
    response = requests.post(f"{API_URL}/questionnaire", json=test_questionnaire)
    assert response.status_code == 200, f"Questionnaire endpoint failed: {response.text}"
    
    data = response.json()
    assert "questionnaire_id" in data, "Response missing questionnaire_id"
    assert "recommended_tools" in data, "Response missing recommended_tools"
    assert isinstance(data["recommended_tools"], list), "recommended_tools should be a list"
    
    # Check if we got recommendations (should be up to 5)
    assert len(data["recommended_tools"]) > 0, "No tool recommendations returned"
    assert len(data["recommended_tools"]) <= 5, "Too many tool recommendations returned"
    
    # Verify tool structure
    for tool in data["recommended_tools"]:
        assert "id" in tool, "Tool missing id"
        assert "name" in tool, "Tool missing name"
        assert "category" in tool, "Tool missing category"
    
    print(f"✅ Questionnaire endpoint test passed - received {len(data['recommended_tools'])} recommendations")
    return data

def test_tools_endpoint():
    """Test the tools endpoint to get all tools"""
    print("\n🧪 Testing tools endpoint...")
    response = requests.get(f"{API_URL}/tools")
    assert response.status_code == 200, f"Tools endpoint failed: {response.text}"
    
    data = response.json()
    assert "tools" in data, "Response missing tools field"
    assert isinstance(data["tools"], list), "tools should be a list"
    assert len(data["tools"]) > 0, "No tools returned"
    
    # Verify tool structure for the first tool
    tool = data["tools"][0]
    assert "id" in tool, "Tool missing id"
    assert "name" in tool, "Tool missing name"
    assert "category" in tool, "Tool missing category"
    assert "description" in tool, "Tool missing description"
    assert "pricing" in tool, "Tool missing pricing"
    assert "features" in tool, "Tool missing features"
    assert "target_audience" in tool, "Tool missing target_audience"
    
    print(f"✅ Tools endpoint test passed - received {len(data['tools'])} tools")
    return data["tools"]

def test_tool_details_endpoint(tools: List[Dict[str, Any]]):
    """Test the tool details endpoint with AI summary"""
    print("\n🧪 Testing tool details endpoint...")
    # Get the first tool's ID
    tool_id = tools[0]["id"]
    
    response = requests.get(f"{API_URL}/tools/{tool_id}")
    assert response.status_code == 200, f"Tool details endpoint failed: {response.text}"
    
    data = response.json()
    assert "tool" in data, "Response missing tool field"
    
    tool = data["tool"]
    assert "id" in tool, "Tool missing id"
    assert "name" in tool, "Tool missing name"
    assert "ai_summary" in tool, "Tool missing AI summary"
    assert tool["ai_summary"], "AI summary is empty"
    
    print(f"✅ Tool details endpoint test passed - received AI summary for {tool['name']}")
    return tool

def test_user_profile_endpoint():
    """Test user profile creation"""
    print("\n🧪 Testing user profile endpoint...")
    user = create_test_user()
    
    assert "id" in user, "User missing id"
    assert "email" in user, "User missing email"
    assert "name" in user, "User missing name"
    assert user["email"] == test_user["email"], "User email doesn't match"
    assert user["name"] == test_user["name"], "User name doesn't match"
    
    print(f"✅ User profile endpoint test passed - created user {user['id']}")
    return user

def test_saved_tools_endpoints(user: Dict[str, Any], tool: Dict[str, Any]):
    """Test saving and retrieving tools for a user"""
    print("\n🧪 Testing saved tools endpoints...")
    user_id = user["id"]
    tool_id = tool["id"]
    
    # Save a tool
    save_response = requests.post(f"{API_URL}/saved-tools", json={
        "user_id": user_id,
        "tool_id": tool_id
    })
    assert save_response.status_code == 200, f"Save tool endpoint failed: {save_response.text}"
    
    # Get saved tools
    get_response = requests.get(f"{API_URL}/saved-tools/{user_id}")
    assert get_response.status_code == 200, f"Get saved tools endpoint failed: {get_response.text}"
    
    data = get_response.json()
    assert "saved_tools" in data, "Response missing saved_tools field"
    assert isinstance(data["saved_tools"], list), "saved_tools should be a list"
    assert len(data["saved_tools"]) > 0, "No saved tools returned"
    
    # Verify the saved tool is the one we saved
    saved_tool_ids = [t["id"] for t in data["saved_tools"]]
    assert tool_id in saved_tool_ids, f"Saved tool {tool_id} not found in saved tools"
    
    print(f"✅ Saved tools endpoints test passed - saved and retrieved tool {tool_id}")
    
    # Test removing a saved tool
    delete_response = requests.delete(f"{API_URL}/saved-tools/{user_id}/{tool_id}")
    assert delete_response.status_code == 200, f"Delete saved tool endpoint failed: {delete_response.text}"
    
    # Verify tool was removed
    get_response_after = requests.get(f"{API_URL}/saved-tools/{user_id}")
    data_after = get_response_after.json()
    saved_tool_ids_after = [t["id"] for t in data_after["saved_tools"]]
    assert tool_id not in saved_tool_ids_after, f"Tool {tool_id} still in saved tools after deletion"
    
    print(f"✅ Remove saved tool endpoint test passed - removed tool {tool_id}")

def test_recent_searches_endpoint(user: Dict[str, Any]):
    """Test retrieving recent searches for a user"""
    print("\n🧪 Testing recent searches endpoint...")
    user_id = user["id"]
    
    # Note: This might return empty results since we haven't associated
    # the questionnaire with the user in our test
    response = requests.get(f"{API_URL}/recent-searches/{user_id}")
    assert response.status_code == 200, f"Recent searches endpoint failed: {response.text}"
    
    data = response.json()
    assert "recent_searches" in data, "Response missing recent_searches field"
    assert isinstance(data["recent_searches"], list), "recent_searches should be a list"
    
    print(f"✅ Recent searches endpoint test passed")

def run_all_tests():
    """Run all tests in sequence"""
    print("\n🚀 Starting backend API tests...")
    
    try:
        # Test basic endpoints
        test_root_endpoint()
        
        # Test tools endpoints
        tools = test_tools_endpoint()
        tool = test_tool_details_endpoint(tools)
        
        # Test questionnaire and recommendations
        questionnaire_data = test_questionnaire_endpoint()
        
        # Test user and saved tools
        user = test_user_profile_endpoint()
        test_saved_tools_endpoints(user, tool)
        test_recent_searches_endpoint(user)
        
        print("\n✅ All backend tests passed successfully! ✅")
        return True
    except Exception as e:
        print(f"\n❌ Tests failed: {str(e)}")
        return False

if __name__ == "__main__":
    run_all_tests()