from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import os
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Database connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client.finance_tools_db

# OpenAI configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Pydantic models
class QuestionnaireResponse(BaseModel):
    position: str
    use_case: str
    budget: str
    company_size: str
    data_types: List[str]
    integration_needs: str
    team_size: str

class UserProfile(BaseModel):
    email: str
    name: str
    preferences: Optional[Dict] = {}

class ToolDetail(BaseModel):
    id: str
    name: str
    category: str
    description: str
    pricing: str
    website: str
    features: List[str]
    target_audience: List[str]
    ai_summary: Optional[str] = None

class SavedTool(BaseModel):
    user_id: str
    tool_id: str

# Initialize curated financial tools
async def initialize_tools():
    """Initialize the database with curated financial data analysis tools"""
    tools_collection = db.tools
    
    # Check if tools already exist
    existing_tools = await tools_collection.count_documents({})
    if existing_tools > 0:
        return
    
    curated_tools = [
        {
            "id": str(uuid.uuid4()),
            "name": "Tableau",
            "category": "Data Visualization",
            "description": "Leading business intelligence and data visualization platform",
            "pricing": "Starting at $70/month per user",
            "website": "https://www.tableau.com",
            "features": ["Interactive dashboards", "Real-time analytics", "Data blending", "Mobile support"],
            "target_audience": ["Data analysts", "Business users", "Executives"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Power BI",
            "category": "Data Visualization",
            "description": "Microsoft's business analytics solution",
            "pricing": "Starting at $10/month per user",
            "website": "https://powerbi.microsoft.com",
            "features": ["Excel integration", "Cloud connectivity", "AI insights", "Custom visualizations"],
            "target_audience": ["Excel users", "Business analysts", "IT professionals"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Python (pandas/numpy)",
            "category": "Programming Tools",
            "description": "Open-source data analysis and manipulation libraries",
            "pricing": "Free",
            "website": "https://pandas.pydata.org",
            "features": ["Data manipulation", "Statistical analysis", "Machine learning", "Automation"],
            "target_audience": ["Data scientists", "Analysts", "Developers"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Alteryx",
            "category": "Data Preparation",
            "description": "Self-service data analytics platform",
            "pricing": "Starting at $5,195/year",
            "website": "https://www.alteryx.com",
            "features": ["Data preparation", "Advanced analytics", "Predictive modeling", "Workflow automation"],
            "target_audience": ["Data analysts", "Business analysts", "Data scientists"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Qlik Sense",
            "category": "Data Visualization",
            "description": "Associative analytics platform",
            "pricing": "Starting at $30/month per user",
            "website": "https://www.qlik.com",
            "features": ["Associative model", "Self-service analytics", "Mobile apps", "AI insights"],
            "target_audience": ["Business users", "Data analysts", "IT teams"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Looker",
            "category": "Business Intelligence",
            "description": "Modern business intelligence platform",
            "pricing": "Contact for pricing",
            "website": "https://looker.com",
            "features": ["Data modeling", "Embedded analytics", "API-first", "Real-time insights"],
            "target_audience": ["Data teams", "Developers", "Business users"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "SAS",
            "category": "Statistical Software",
            "description": "Advanced analytics and statistical software",
            "pricing": "Contact for pricing",
            "website": "https://www.sas.com",
            "features": ["Advanced statistics", "Machine learning", "Data mining", "Forecasting"],
            "target_audience": ["Statisticians", "Data scientists", "Researchers"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "SPSS",
            "category": "Statistical Software",
            "description": "Statistical analysis software package",
            "pricing": "Starting at $99/month",
            "website": "https://www.ibm.com/spss",
            "features": ["Statistical analysis", "Data mining", "Survey research", "Predictive analytics"],
            "target_audience": ["Researchers", "Analysts", "Students"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "R",
            "category": "Programming Tools",
            "description": "Open-source statistical computing language",
            "pricing": "Free",
            "website": "https://www.r-project.org",
            "features": ["Statistical computing", "Data visualization", "Machine learning", "Extensive packages"],
            "target_audience": ["Statisticians", "Data scientists", "Researchers"]
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Excel Power Query",
            "category": "Data Preparation",
            "description": "Excel's data connection and preparation tool",
            "pricing": "Included with Excel",
            "website": "https://docs.microsoft.com/en-us/power-query/",
            "features": ["Data transformation", "Multiple data sources", "Automation", "Easy to use"],
            "target_audience": ["Excel users", "Business analysts", "Finance teams"]
        }
    ]
    
    await tools_collection.insert_many(curated_tools)
    print("Curated financial tools initialized successfully!")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database with curated tools
    await initialize_tools()
    yield

app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI-powered tool recommendation
async def generate_tool_recommendations(questionnaire: QuestionnaireResponse, tools: List[Dict]) -> List[Dict]:
    """Generate AI-powered tool recommendations based on questionnaire responses"""
    
    # Create system message for tool recommendation
    system_message = """You are an expert financial data analysis consultant. Based on user requirements, recommend the most suitable tools from the provided list. 
    
    Analyze the user's:
    - Position and role
    - Specific use case
    - Budget constraints
    - Company size
    - Data types they work with
    - Integration requirements
    - Team size
    
    Rank tools by relevance and provide reasoning for each recommendation."""
    
    # Create user message with questionnaire data and available tools
    user_message = f"""
    User Profile:
    - Position: {questionnaire.position}
    - Use Case: {questionnaire.use_case}
    - Budget: {questionnaire.budget}
    - Company Size: {questionnaire.company_size}
    - Data Types: {', '.join(questionnaire.data_types)}
    - Integration Needs: {questionnaire.integration_needs}
    - Team Size: {questionnaire.team_size}
    
    Available Tools:
    {str([{'name': tool['name'], 'category': tool['category'], 'pricing': tool['pricing'], 'description': tool['description']} for tool in tools])}
    
    Please recommend the top 5 most suitable tools and provide a brief explanation for each recommendation.
    Return only the tool names and reasoning in a clear format.
    """
    
    try:
        # Initialize chat with OpenAI
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-4.1-mini")
        
        # Send message and get response
        response = await chat.send_message(UserMessage(text=user_message))
        
        # Parse recommendations and match with tools
        recommended_tools = []
        for tool in tools:
            if tool['name'].lower() in response.lower():
                recommended_tools.append(tool)
        
        return recommended_tools[:5]  # Return top 5 recommendations
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        # Fallback to simple matching
        return tools[:5]

# AI-powered tool summary generation
async def generate_tool_summary(tool: Dict) -> str:
    """Generate AI summary for a specific tool"""
    
    system_message = "You are a financial technology expert. Create concise, informative summaries of financial data analysis tools."
    
    user_message = f"""
    Create a comprehensive summary for this financial tool:
    
    Tool Name: {tool['name']}
    Category: {tool['category']}
    Description: {tool['description']}
    Pricing: {tool['pricing']}
    Features: {', '.join(tool['features'])}
    Target Audience: {', '.join(tool['target_audience'])}
    
    Please provide:
    1. Key strengths and benefits
    2. Best use cases
    3. Who should consider this tool
    4. Any limitations or considerations
    
    Keep it concise but informative (max 200 words).
    """
    
    try:
        chat = LlmChat(
            api_key=OPENAI_API_KEY,
            session_id=str(uuid.uuid4()),
            system_message=system_message
        ).with_model("openai", "gpt-4.1-mini")
        
        response = await chat.send_message(UserMessage(text=user_message))
        return response
        
    except Exception as e:
        print(f"Error generating summary: {e}")
        return f"Professional {tool['category'].lower()} solution designed for {', '.join(tool['target_audience'])}. Known for {', '.join(tool['features'][:3])}."

# API Routes
@app.get("/")
async def root():
    return {"message": "Financial AI Tools Directory API"}

@app.post("/api/questionnaire")
async def submit_questionnaire(questionnaire: QuestionnaireResponse):
    """Submit questionnaire and get AI-powered tool recommendations"""
    
    # Get all tools from database
    tools_collection = db.tools
    tools_cursor = tools_collection.find({})
    tools = await tools_cursor.to_list(length=100)
    
    # Generate AI recommendations
    recommended_tools = await generate_tool_recommendations(questionnaire, tools)
    
    # Store questionnaire and search history
    questionnaire_data = {
        "id": str(uuid.uuid4()),
        "responses": questionnaire.dict(),
        "created_at": datetime.utcnow(),
        "recommended_tools": [tool["id"] for tool in recommended_tools]
    }
    
    await db.questionnaires.insert_one(questionnaire_data)
    
    return {
        "questionnaire_id": questionnaire_data["id"],
        "recommended_tools": recommended_tools
    }

@app.get("/api/tools")
async def get_all_tools():
    """Get all available tools"""
    tools_collection = db.tools
    tools_cursor = tools_collection.find({})
    tools = await tools_cursor.to_list(length=100)
    return {"tools": tools}

@app.get("/api/tools/{tool_id}")
async def get_tool_details(tool_id: str):
    """Get detailed information about a specific tool including AI summary"""
    
    tool = await db.tools.find_one({"id": tool_id})
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Generate AI summary if not already available
    if not tool.get("ai_summary"):
        ai_summary = await generate_tool_summary(tool)
        tool["ai_summary"] = ai_summary
        
        # Update tool in database with AI summary
        await db.tools.update_one(
            {"id": tool_id},
            {"$set": {"ai_summary": ai_summary}}
        )
    
    return {"tool": tool}

@app.post("/api/users")
async def create_user(user: UserProfile):
    """Create a new user profile"""
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_data = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "name": user.name,
        "preferences": user.preferences,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_data)
    return {"user": user_data}

@app.post("/api/saved-tools")
async def save_tool(saved_tool: SavedTool):
    """Save a tool to user's saved list"""
    
    # Check if already saved
    existing_saved = await db.saved_tools.find_one({
        "user_id": saved_tool.user_id,
        "tool_id": saved_tool.tool_id
    })
    
    if existing_saved:
        raise HTTPException(status_code=400, detail="Tool already saved")
    
    saved_data = {
        "id": str(uuid.uuid4()),
        "user_id": saved_tool.user_id,
        "tool_id": saved_tool.tool_id,
        "created_at": datetime.utcnow()
    }
    
    await db.saved_tools.insert_one(saved_data)
    return {"message": "Tool saved successfully"}

@app.get("/api/saved-tools/{user_id}")
async def get_saved_tools(user_id: str):
    """Get user's saved tools"""
    
    # Get saved tool IDs
    saved_tools_cursor = db.saved_tools.find({"user_id": user_id})
    saved_tools = await saved_tools_cursor.to_list(length=100)
    
    tool_ids = [saved["tool_id"] for saved in saved_tools]
    
    # Get tool details
    tools_cursor = db.tools.find({"id": {"$in": tool_ids}})
    tools = await tools_cursor.to_list(length=100)
    
    return {"saved_tools": tools}

@app.get("/api/recent-searches/{user_id}")
async def get_recent_searches(user_id: str):
    """Get user's recent questionnaire searches"""
    
    recent_searches_cursor = db.questionnaires.find({"user_id": user_id}).sort("created_at", -1).limit(10)
    recent_searches = await recent_searches_cursor.to_list(length=10)
    
    return {"recent_searches": recent_searches}

@app.delete("/api/saved-tools/{user_id}/{tool_id}")
async def remove_saved_tool(user_id: str, tool_id: str):
    """Remove a tool from user's saved list"""
    
    result = await db.saved_tools.delete_one({
        "user_id": user_id,
        "tool_id": tool_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved tool not found")
    
    return {"message": "Tool removed from saved list"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)