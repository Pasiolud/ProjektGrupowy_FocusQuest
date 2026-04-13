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
    
    # 1. Earned points
    # 1 second = 1 XP
    # 1 minute = 1 Coin
    earned_xp = req.duration_seconds
    earned_coins = int(req.duration_seconds / 60)
    
    # 2. Daily reset and streak logic
    now = datetime.now()
    today_str = now.date().isoformat()
    last_session_date = profile.get("last_session_date")
    
    new_daily_focus = profile.get("daily_focus_seconds", 0)
    new_streak = profile.get("current_streak", 0)
    
    if last_session_date:
        if last_session_date != today_str:
            # Different day. Check if streak continued (was it yesterday?)
            last_date_obj = datetime.strptime(last_session_date, "%Y-%m-%d").date()
            yesterday_obj = (now - timedelta(days=1)).date()
            
            if last_date_obj == yesterday_obj:
                new_streak += 1
            elif last_date_obj < yesterday_obj:
                new_streak = 1 # Streak broken, start fresh
            
            new_daily_focus = 0 # It's a new day, reset daily counter
    else:
        new_streak = 1 # First session ever
        new_daily_focus = 0
            
    # 3. Apply increments
    new_total_xp = profile.get("total_xp", 0) + earned_xp
    new_coins = profile.get("coins", 0) + earned_coins
    new_weekly_focus = profile.get("weekly_focus_seconds", 0) + req.duration_seconds
    new_daily_focus += req.duration_seconds
    new_total_sessions = profile.get("total_sessions", 0) + 1
    
    # 4. Level Calculation (XP_needed = 1000 * current_level^1.5)
    def get_level(xp):
        lvl = 1
        needed = 1000 * (lvl**1.5)
        remaining = xp
        while remaining >= needed:
            remaining -= needed
            lvl += 1
            needed = 1000 * (lvl**1.5)
        return lvl

    new_level = get_level(new_total_xp)
    
    # 5. Garden Progression (all active plants grow together)
    garden_slots = profile.get("garden_slots", [])
    if isinstance(garden_slots, str): garden_slots = json.loads(garden_slots) # safety
    
    for plant in garden_slots:
        plant["progress"] = plant.get("progress", 0) + req.duration_seconds
        
    # 6. Seed Reward (logic: 1 random seed after complete session)
    seed_pool = [
        {"type": "oak", "name": "Dąb Mądrości", "rarity": "common", "target": 7200, "value": 2000},
        {"type": "fire", "name": "Ognisty Kwiat", "rarity": "rare", "target": 14400, "value": 5000},
        {"type": "star", "name": "Gwiezdne Pnącze", "rarity": "legendary", "target": 28800, "value": 12000}
    ]
    new_seed = random.choices(seed_pool, weights=[70, 25, 5], k=1)[0]
    
    seed_inventory = profile.get("seed_inventory", [])
    if isinstance(seed_inventory, str): seed_inventory = json.loads(seed_inventory)
    seed_inventory.append(new_seed)

    update_data = {
        "total_xp": new_total_xp,
        "coins": new_coins,
        "level": new_level,
        "weekly_focus_seconds": new_weekly_focus,
        "daily_focus_seconds": new_daily_focus,
        "total_sessions": new_total_sessions,
        "current_streak": new_streak,
        "last_session_date": today_str,
        "longest_streak": max(new_streak, profile.get("longest_streak", 0)),
        "garden_slots": json.dumps(garden_slots),
        "seed_inventory": json.dumps(seed_inventory)
    }
    supabase.table("profiles").update(update_data).eq("id", user_id).execute()
    
    try:
        # Also log the session itself 
        supabase.table("sessions").insert({"user_id": user_id, "duration_seconds": req.duration_seconds}).execute()
    except Exception as e:
        print("Session logging skip/error:", e)
        pass # Optional phase
    
    return {
        "status": "success", 
        "earned": {"xp": earned_xp, "coins": earned_coins},
        "new_level": new_level
    }


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
         
    # Fetch all items from DB
    items_resp = supabase.table("items").select("*").execute()
    all_items = items_resp.data
    if not all_items:
        raise HTTPException(status_code=500, detail="Items not configured in database!")
        
    drawn_item = random.choice(all_items)
    
    # Check if user already owns it
    user_items_resp = supabase.table("user_items").select("*").eq("user_id", user_id).eq("item_id", drawn_item["id"]).execute()
    is_duplicate = len(user_items_resp.data) > 0
    
    new_coins = profile.get("coins", 0) - req.cost
    
    if is_duplicate:
        # Refund 50%
        new_coins += int(req.cost / 2)
    else:
        # Give item to user
        supabase.table("user_items").insert({"user_id": user_id, "item_id": drawn_item["id"]}).execute()
        
    supabase.table("profiles").update({"coins": new_coins}).eq("id", user_id).execute()
    
    return {
        "status": "success", 
        "item": {
            "id": drawn_item["id"],
            "name": drawn_item["name"], 
            "icon": drawn_item["icon"],
            "category": drawn_item["category"],
            "rarity": drawn_item["rarity"],
            "is_duplicate": is_duplicate
        }
    }


@app.get("/api/inventory")
def get_inventory(db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    
    # Fetch user_items joined with items
    resp = supabase.table("user_items").select("*, items(*)").eq("user_id", user_id).execute()
    return {"status": "success", "inventory": [x["items"] for x in resp.data if x.get("items")]}


class EquipRequest(BaseModel):
    item_id: str
    category: str
    css_value: str

import json

@app.post("/api/inventory/equip")
def equip_item(req: EquipRequest, db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    
    profile_resp = supabase.table("profiles").select("equipped_theme").eq("id", user_id).execute()
    if not profile_resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile = profile_resp.data[0]
    
    equipped = {}
    raw_theme = profile.get("equipped_theme")
    if raw_theme:
        try:
            # Try to parse existing JSON
            equipped = json.loads(raw_theme)
            if not isinstance(equipped, dict):
                equipped = {}
        except (json.JSONDecodeError, TypeError):
            # If it's a plain string like "default", just start fresh
            equipped = {}
            
    equipped[req.category] = req.css_value
    
    supabase.table("profiles").update({"equipped_theme": json.dumps(equipped)}).eq("id", user_id).execute()
    
    return {"status": "success", "equipped_theme": equipped}


class UnequipRequest(BaseModel):
    category: str

@app.post("/api/inventory/unequip")
def unequip_item(req: UnequipRequest, db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    
    profile_resp = supabase.table("profiles").select("equipped_theme").eq("id", user_id).execute()
    if not profile_resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    profile = profile_resp.data[0]
    raw_theme = profile.get("equipped_theme")
    
    equipped = {}
    if raw_theme:
        try:
            equipped = json.loads(raw_theme)
        except:
            equipped = {}
            
    if req.category in equipped:
        del equipped[req.category]
        
    supabase.table("profiles").update({"equipped_theme": json.dumps(equipped)}).eq("id", user_id).execute()
    
    return {"status": "success", "equipped_theme": equipped}


@app.get("/api/leaderboard")
def get_leaderboard(db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    resp = supabase.table("profiles").select("*").order("total_xp", desc=True).limit(10).execute()
    return {"status": "success", "leaderboard": resp.data}


# GARDEN ENDPOINTS
class PlantRequest(BaseModel):
    seed_index: int

@app.post("/api/garden/plant")
def plant_seed(req: PlantRequest, db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    
    profile = supabase.table("profiles").select("garden_slots, seed_inventory").eq("id", user_id).execute().data[0]
    garden = json.loads(profile["garden_slots"])
    seeds = json.loads(profile["seed_inventory"])
    
    if len(garden) >= 3:
        raise HTTPException(status_code=400, detail="Ogród jest pełen (max 3 rośliny)")
    
    if req.seed_index < 0 or req.seed_index >= len(seeds):
        raise HTTPException(status_code=400, detail="Nieprawidłowy indeks nasiona")
    
    # Move from seeds to garden
    new_plant = seeds.pop(req.seed_index)
    new_plant["progress"] = 0
    new_plant["id"] = str(datetime.now().timestamp())
    garden.append(new_plant)
    
    supabase.table("profiles").update({
        "garden_slots": json.dumps(garden),
        "seed_inventory": json.dumps(seeds)
    }).eq("id", user_id).execute()
    
    return {"status": "success", "garden": garden}

class SellRequest(BaseModel):
    plant_id: str

@app.post("/api/garden/sell")
def sell_plant(req: SellRequest, db_auth: dict = Depends(get_supabase_client)):
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    
    profile = supabase.table("profiles").select("garden_slots, coins").eq("id", user_id).execute().data[0]
    garden = json.loads(profile["garden_slots"])
    
    plant_to_sell = None
    for i, p in enumerate(garden):
        if p.get("id") == req.plant_id:
            if p["progress"] >= p["target"]:
                plant_to_sell = garden.pop(i)
                break
            else:
                raise HTTPException(status_code=400, detail="Roślina jeszcze nie wyrosła")
                
    if not plant_to_sell:
        raise HTTPException(status_code=404, detail="Nie znaleziono rośliny do sprzedaży")
        
    new_coins = profile["coins"] + plant_to_sell["value"]
    
    supabase.table("profiles").update({
        "garden_slots": json.dumps(garden),
        "coins": new_coins
    }).eq("id", user_id).execute()
    
    return {"status": "success", "earned": plant_to_sell["value"], "new_coins": new_coins}
