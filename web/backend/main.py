from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Wczytywanie stałych zmiennych z głównego pliku .env w c:\FocusQuest
load_dotenv(dotenv_path="../../.env")

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY")

app = FastAPI(title="FocusQuest Backend")

# Pozwalamy frontendowi (domyślnie z porta 5173 / localhost) komunikować się z serwerem Pythona
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # W produkcji zamień to na konkretny url Twojego frontendu
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Funkcja pomocnicza / dependency do weryfikacji tokenu użytkownika
def get_supabase_client(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Brak nagłówka Authorization")
    
    token = authorization.replace("Bearer ", "") if "Bearer" in authorization else authorization
    
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        # Weryfikacja JWT w Supabase
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
             raise HTTPException(status_code=401, detail="Nieprawidłowy lub zgasły token")
        
        # Ustawienie tokenu dla zapytań do DB, dzięki temu działają polityki bezpieczeństwa (RLS)
        supabase.postgrest.auth(token)
        return {"client": supabase, "user_id": user_response.user.id}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Błąd logowania: {str(e)}")

@app.get("/")
def read_root():
    return {"message": "FocusQuest Backend API działa! 🚀"}

# Endpoint testowy do sprawdzenia, czy autoryzacja działa poprawnie
@app.get("/api/me")
def get_my_profile(db_auth: dict = Depends(get_supabase_client)):
    # Ponieważ przeszliśmy test tokenu, możemy odpytać Supabase o użytkownika
    # Zabezpieczenia (RLS) przepuszczą nas bez problemu jako "właściciela" rekordu.
    
    supabase = db_auth["client"]
    user_id = db_auth["user_id"]
    
    # Zbieramy dane
    profile = supabase.table("profiles").select("*").eq("id", user_id).execute()
    
    return {
        "status": "success",
        "user_id": user_id, 
        "profile": profile.data[0] if profile.data else None
    }
