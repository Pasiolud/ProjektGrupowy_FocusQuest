from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../.env")

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")

app = FastAPI(title="FocusQuest Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_supabase_client(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Brak nagłówka Authorization")
    
    token = authorization.replace("Bearer ", "") if "Bearer" in authorization else authorization
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
             raise HTTPException(status_code=401, detail="Nieprawidłowy lub zgasły token")
        
        supabase.postgrest.auth(token)
        return {"client": supabase, "user_id": user_response.user.id}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Błąd logowania: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "FocusQuest Backend API działa"}

@app.get("/api/me")
def get_my_profile(db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    return {
        "status": "success",
        "user_id": user_id, 
        "profile": profile.data[0] if profile.data else None
    }

from pydantic import BaseModel
import math
import random

class SessionCompleteRequest(BaseModel):
    duration_seconds: int

class ShopBuyRequest(BaseModel):
    box_type: str
    cost: int

@app.post("/api/session/complete")
def complete_session(req: SessionCompleteRequest, db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    
    profile_resp = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile_resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile = profile_resp.data[0]
    
    # Calculate rewards based on plan
    earned_xp = req.duration_seconds
    earned_coins = int(req.duration_seconds / 60)
    
    new_total_xp = profile.get("total_xp", 0) + earned_xp
    new_coins = profile.get("coins", 0) + earned_coins
    
    # Calculate level logarithmically (XP_required = 100 * (level^1.5))
    theoretical_level = int(math.floor((new_total_xp / 100) ** (1/1.5)))
    new_level = max(1, theoretical_level)
    
    new_weekly_focus = profile.get("weekly_focus_seconds", 0) + req.duration_seconds
    
    update_data = {
        "total_xp": new_total_xp,
        "coins": new_coins,
        "level": new_level,
        "weekly_focus_seconds": new_weekly_focus
    }
    
    supabase.table("profiles").update(update_data).eq("id", user_id).execute()
    
    try:
        # Also log the session itself 
        supabase.table("sessions").insert({"user_id": user_id, "duration_seconds": req.duration_seconds}).execute()
    except Exception as e:
        print("Session logging skip/error:", e)
        pass # Optional phase
    
    return {"status": "success", "earned": {"xp": earned_xp, "coins": earned_coins}}


@app.post("/api/shop/open-box")
def open_box(req: ShopBuyRequest, db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    
    profile_resp = supabase.table("profiles").select("*").eq("id", user_id).execute()
    if not profile_resp.data:
         raise HTTPException(status_code=404, detail="Profile not found")
         
    profile = profile_resp.data[0]
    if profile.get("coins", 0) < req.cost:
         raise HTTPException(status_code=400, detail="Nie masz wystarczającej ilości monet!")
         
    possible_items = [
        {"id": "theme_dark", "name": "Motyw Mrocznego Dębu", "icon": "dark_mode"},
        {"id": "theme_light", "name": "Motyw Słonecznej Brzozy", "icon": "light_mode"},
        {"id": "sound_rain", "name": "Szum Wiosennego Deszczu", "icon": "water_drop"},
        {"id": "sound_wind", "name": "Górski Wiatr", "icon": "air"}
    ]
    drawn_item = random.choice(possible_items)
    
    # 50% duplicate chance logic mockup
    is_duplicate = random.choice([True, False])
    
    new_coins = profile.get("coins", 0) - req.cost
    if is_duplicate:
        # Refund 50%
        new_coins += int(req.cost / 2)
        
    supabase.table("profiles").update({"coins": new_coins}).eq("id", user_id).execute()
    
    return {
        "status": "success", 
        "item": {
            "name": drawn_item["name"], 
            "icon": drawn_item["icon"], 
            "is_duplicate": is_duplicate
        }
    }


@app.get("/api/leaderboard")
def get_leaderboard(db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    
    # Fetch top 10 players based on total_xp. 
    # Assumes RLS on profiles allows read access for authenticated users to view leaderboards
    resp = supabase.table("profiles").select("id, level, total_xp, current_streak").order("total_xp", desc=True).limit(10).execute()
    
    return {
        "status": "success",
        "leaderboard": resp.data
    }
