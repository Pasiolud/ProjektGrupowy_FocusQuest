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
