import os
import csv
import io
import uuid
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Missing Supabase environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI()

# In-memory job status simulation (replace with persistent store in production)
jobs = {}

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Timetable Scheduler API"}

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files allowed")
    
    content = await file.read()
    
    # 1. Store original CSV in Supabase Storage (uploads bucket)
    file_path = f"uploads/{datetime.utcnow().strftime('%Y%m%d_%H%M%S_')}{file.filename}"
    storage_response = supabase.storage.from_("uploads").upload(file_path, content)
    
    if storage_response.get('error'):
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {storage_response['error']['message']}")
    
    # 2. Parse CSV content
    file_stream = io.StringIO(content.decode('utf-8'))
    csv_reader = csv.DictReader(file_stream)
    rows = list(csv_reader)
    
    if len(rows) == 0:
        raise HTTPException(status_code=400, detail="CSV file is empty")

    # 3. Example validation for courses CSV (adjust dynamically based on CSV type if needed)
    required_columns = {'id', 'name', 'code'}  # Adjust if processing different CSVs
    
    if not required_columns.issubset(set(rows[0].keys())):
        raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_columns}")

    # 4. Build batch insert data for courses table (change if inserting other data)
    try:
        batch_data = [{"id": int(row['id']), "name": row['name'], "code": row['code']} for row in rows]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid data format: {str(e)}")

    insert_response = supabase.table("courses").insert(batch_data).execute()
    
    if insert_response.get('error'):
        # Log failure with audit record
        supabase.table("import_audit").insert({
            "filename": file.filename,
            "status": "failed",
            "message": insert_response['error']['message']
        }).execute()
        raise HTTPException(status_code=500, detail="Insert failed: " + insert_response['error']['message'])

    # 5. Log success in import audit
    supabase.table("import_audit").insert({
        "filename": file.filename,
        "status": "success",
        "message": f"Inserted {len(batch_data)} records"
    }).execute()

    return JSONResponse(content={"message": f"Uploaded and inserted {len(batch_data)} rows", "storage_path": file_path})

@app.post("/generate-timetable")
async def generate_timetable():
    job_id = str(uuid.uuid4())
    jobs[job_id] = "pending"
    # TODO: add async timetable generation logic later
    return {"job_id": job_id, "status": "pending"}

@app.get("/job/{job_id}")
async def get_job_status(job_id: str):
    status = jobs.get(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "status": status}

@app.get("/timetable")
async def get_timetable(user_id: str, role: str):
    # TODO: add proper query logic based on role and user_id
    return {"user_id": user_id, "role": role, "timetable": []}

def fetch_all_data():
    # Example helper function fetching all tables
    courses = supabase.table("courses").select("*").execute()
    professors = supabase.table("professors").select("*").execute()
    students = supabase.table("students").select("*").execute()
    classrooms = supabase.table("classrooms").select("*").execute()
    timetable_slots = supabase.table("timetable_slots").select("*").execute()
    groups = supabase.table("groups").select("*").execute()
    group_students = supabase.table("group_students").select("*").execute()

    return {
        "courses": courses.data,
        "professors": professors.data,
        "students": students.data,
        "classrooms": classrooms.data,
        "timetable_slots": timetable_slots.data,
        "groups": groups.data,
        "group_students": group_students.data
    }
