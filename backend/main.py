import os
import csv
import io
import uuid
from datetime import datetime, time, date
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv
import random

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Missing Supabase environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI()

jobs = {}

def convert_to_serializable(obj):
    """Convert datetime objects to ISO strings for JSON serialization"""
    if isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(i) for i in obj]
    elif isinstance(obj, (datetime, date)):
        return obj.isoformat()
    elif isinstance(obj, time):
        return obj.strftime('%H:%M:%S')
    else:
        return obj

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Timetable Scheduler API"}

@app.post("/upload-csv")
async def upload_csv(data_type: str, file: UploadFile = File(...)):
    allowed_types = {"courses", "professors", "students", "enrollments", "classrooms", "timetable_slots", "groups"}
    if data_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid data_type")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV files allowed")

    content = await file.read()
    file_path = f"uploads/{datetime.utcnow().strftime('%Y%m%d_%H%M%S_')}{file.filename}"
    
    try:
        supabase.storage.from_("uploads").upload(file_path, content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Storage upload failed: {str(e)}",
        )

    try:
        file_stream = io.StringIO(content.decode("utf-8"))
        csv_reader = csv.DictReader(file_stream)
        rows = list(csv_reader)
        
        if not rows:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        table_name = ""
        batch_data = []

        if data_type == "courses":
            required_cols = {"id", "name", "code"}
            if not required_cols.issubset(rows[0].keys()):
                raise HTTPException(status_code=400, detail=f"CSV for courses must contain columns: {required_cols}")
            table_name = "courses"
            batch_data = [{"id": int(row['id']), "name": row['name'], "code": row['code']} for row in rows]
        
        elif data_type == "professors":
            required_cols = {"id", "name", "email"}
            if not required_cols.issubset(rows[0].keys()):
                raise HTTPException(status_code=400, detail=f"CSV for professors must contain columns: {required_cols}")
            table_name = "professors"
            batch_data = [{"id": int(row['id']), "name": row['name'], "email": row['email']} for row in rows]
        
        elif data_type == "students":
            required_cols = {"id", "name", "email"}
            if not required_cols.issubset(rows[0].keys()):
                raise HTTPException(status_code=400, detail=f"CSV for students must contain columns: {required_cols}")
            table_name = "students"
            batch_data = [{"id": int(row['id']), "name": row['name'], "email": row['email']} for row in rows]
        
        elif data_type == "enrollments":
            required_cols = {"student_id", "course_id"}
            if not required_cols.issubset(rows[0].keys()):
                raise HTTPException(status_code=400, detail=f"CSV for enrollments must contain columns: {required_cols}")
            table_name = "enrollments"
            batch_data = [{"student_id": int(row['student_id']), "course_id": int(row['course_id'])} for row in rows]
        
        elif data_type == "classrooms":
            required_cols = {"id", "name", "capacity"}
            if not required_cols.issubset(rows[0].keys()):
                raise HTTPException(status_code=400, detail=f"CSV for classrooms must contain columns: {required_cols}")
            table_name = "classrooms"
            batch_data = [{"id": int(row['id']), "name": row['name'], "capacity": int(row['capacity'])} for row in rows]
        
        elif data_type == "timetable_slots":
            required_cols = {"id", "day", "start_time", "end_time"}
            if not required_cols.issubset(rows[0].keys()):
                raise HTTPException(status_code=400, detail=f"CSV for timetable_slots must contain columns: {required_cols}")
            table_name = "timetable_slots"
            batch_data = [{"id": int(row['id']), "day": row['day'], "start_time": row['start_time'], "end_time": row['end_time']} for row in rows]
        
        elif data_type == "groups":
            required_cols = {"id", "name"}
            if not required_cols.issubset(rows[0].keys()):
                raise HTTPException(status_code=400, detail=f"CSV for groups must contain columns: {required_cols}")
            table_name = "groups"
            batch_data = [{"id": int(row['id']), "name": row['name']} for row in rows]
        
        else:
            raise HTTPException(status_code=400, detail=f"Data type {data_type} not implemented yet")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Data conversion error: {str(e)}")
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing column in CSV: {str(e)}")
    except UnicodeDecodeError as e:
        raise HTTPException(status_code=400, detail=f"File encoding error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

    try:
        result = supabase.table(table_name).upsert(batch_data, on_conflict='id').execute()
        inserted_count = len(result.data) if result.data else len(batch_data)
        
        supabase.table("import_audit").insert({
            "filename": file.filename,
            "status": "success", 
            "message": f"Upserted {inserted_count} records into {table_name}",
            "records_processed": len(batch_data),
            "records_inserted": inserted_count
        }).execute()

    except Exception as e:
        error_message = str(e)
        supabase.table("import_audit").insert({
            "filename": file.filename,
            "status": "failed", 
            "message": error_message,
            "records_processed": len(batch_data),
            "records_inserted": 0
        }).execute()
        raise HTTPException(status_code=500, detail=f"Database operation failed: {error_message}")

    return JSONResponse({
        "message": f"Uploaded and upserted {len(batch_data)} rows into {table_name}", 
        "storage_path": file_path,
        "records_processed": len(batch_data),
        "records_inserted": inserted_count
    })

def fetch_all_data():
    courses = supabase.table("courses").select("*").execute().data
    professors = supabase.table("professors").select("*").execute().data
    classrooms = supabase.table("classrooms").select("*").execute().data
    timetable_slots = supabase.table("timetable_slots").select("*").execute().data
    groups = supabase.table("groups").select("*").execute().data
    group_students = supabase.table("group_students").select("*").execute().data
    enrollments = supabase.table("enrollments").select("*").execute().data

    return {
        "courses": courses,
        "professors": professors,
        "classrooms": classrooms,
        "timetable_slots": timetable_slots,
        "groups": groups,
        "group_students": group_students,
        "enrollments": enrollments,
    }

def time_slots_conflict(slot1, slot2):
    if slot1['day'] != slot2['day']:
        return False
    return max(slot1['start_time'], slot2['start_time']) < min(slot1['end_time'], slot2['end_time'])

def fitness(schedule, data):
    conflicts = 0
    # Existing conflicts (professor and classroom overlaps)
    for i in range(len(schedule)):
        for j in range(i + 1, len(schedule)):
            a, b = schedule[i], schedule[j]
            if a['professor_id'] == b['professor_id'] and time_slots_conflict(a, b):
                conflicts += 10
            if a['classroom_id'] == b['classroom_id'] and time_slots_conflict(a, b):
                conflicts += 10

    # Student-course-day mapping
    student_course_days = {}
    enrollments = data['enrollments']
    student_courses = {}
    for e in enrollments:
        student_courses.setdefault(e['student_id'], []).append(e['course_id'])

    day_to_num = {'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                  'Thursday': 4, 'Friday': 5, 'Saturday': 6}

    for entry in schedule:
        course = entry['course_id']
        day = entry['day']
        for student_id, courses in student_courses.items():
            if course in courses:
                student_course_days.setdefault((student_id, course), set()).add(day_to_num[day])

    for (student_id, course_id), days in student_course_days.items():
        days_list = sorted(days)
        for i in range(1, len(days_list)):
            if days_list[i] == days_list[i-1]:
                conflicts += 5
            if days_list[i] == days_list[i-1] + 1:
                run_len = 2
                idx = i + 1
                while idx < len(days_list) and days_list[idx] == days_list[idx-1] + 1:
                    run_len += 1
                    idx += 1
                if run_len >= 3:
                    conflicts += 5 * (run_len - 2)

    # Teacher hour constraints
    prof_day_hours = {}
    for entry in schedule:
        key = (entry['professor_id'], entry['day'])
        prof_day_hours[key] = prof_day_hours.get(key, 0) + 1

    prof_week_hours = {}
    for (prof, day), hours in prof_day_hours.items():
        if hours > 8:
            conflicts += (hours - 8) * 10
        prof_week_hours[prof] = prof_week_hours.get(prof, 0) + hours

    for prof, total_hours in prof_week_hours.items():
        diff = abs(20 - total_hours)
        if diff > 5:
            conflicts += diff * 2

    return conflicts

def generate_random_schedule(data):
    schedule = []
    for course in data['courses']:
        prof = random.choice(data['professors'])
        room = random.choice(data['classrooms'])
        # Default to 3 credits if not specified
        credits = 3
        for _ in range(credits):
            slot = random.choice(data['timetable_slots'])
            schedule.append({
                'course_id': course['id'],
                'professor_id': prof['id'],
                'classroom_id': room['id'],
                'day': slot['day'],
                'start_time': slot['start_time'],
                'end_time': slot['end_time']
            })
    return schedule

def run_genetic_algorithm(data, population_size=50, generations=100):
    population = [generate_random_schedule(data) for _ in range(population_size)]
    best_schedule = None
    best_fitness = float('inf')

    for _ in range(generations):
        scored = [(fitness(schedule, data), schedule) for schedule in population]
        scored.sort(key=lambda x: x[0])
        best_current_fitness, best_current_schedule = scored[0]
        if best_current_fitness < best_fitness:
            best_fitness = best_current_fitness
            best_schedule = best_current_schedule
            if best_fitness == 0:
                break
        next_gen = scored[:population_size // 2]
        new_population = [s for _, s in next_gen]
        while len(new_population) < population_size:
            parent1 = random.choice(new_population)
            parent2 = random.choice(new_population)
            child = []
            crossover_point = len(parent1) // 2
            child.extend(parent1[:crossover_point])
            child.extend(parent2[crossover_point:])
            idx = random.randint(0, len(child) - 1)
            child[idx]['professor_id'] = random.choice(data['professors'])['id']
            child[idx]['classroom_id'] = random.choice(data['classrooms'])['id']
            slot = random.choice(data['timetable_slots'])
            child[idx]['day'] = slot['day']
            child[idx]['start_time'] = slot['start_time']
            child[idx]['end_time'] = slot['end_time']
            new_population.append(child)
        population = new_population
    return best_schedule

def persist_schedule(schedule, job_id, term='Fall 2025'):
    # Convert schedule to serializable format first
    serializable_schedule = convert_to_serializable(schedule)
    
    # Create timetable version with ISO format datetime
    version_resp = supabase.table("timetable_versions").insert({
        "term": term,
        "generated_at": datetime.utcnow().isoformat(),
        "job_id": job_id,
    }).execute()

    if not version_resp.data:
        raise Exception("Failed to create timetable version")
    
    version_id = version_resp.data[0]["id"]
    
    # Clear existing schedule rows
    supabase.table("schedule_rows").delete().eq("timetable_version_id", version_id).execute()
    
    # Prepare bulk data for insertion
    bulk_data = []
    for row in serializable_schedule:
        bulk_data.append({
            "timetable_version_id": version_id,
            "course_id": row["course_id"],
            "professor_id": row["professor_id"],
            "classroom_id": row["classroom_id"],
            "day": row["day"],
            "start_time": row["start_time"],
            "end_time": row["end_time"],
        })
    
    # Insert schedule rows
    insert_resp = supabase.table("schedule_rows").insert(bulk_data).execute()
    if not insert_resp.data:
        raise Exception("Failed to insert schedule rows")
    
    # Create professor timetable entries
    professor_entries = {}
    for entry in bulk_data:
        prof = entry["professor_id"]
        if prof not in professor_entries:
            professor_entries[prof] = []
        professor_entries[prof].append(entry)
    
    # Create student timetable entries
    student_entries = {}
    enrollments = supabase.table("enrollments").select("*").execute().data
    student_courses = {}
    for e in enrollments:
        student_courses.setdefault(e["student_id"], []).append(e["course_id"])
    
    for student_id, courses in student_courses.items():
        entries = [e for e in bulk_data if e["course_id"] in courses]
        student_entries[student_id] = entries
    
    # Insert professor timetable entries
    for prof_id, entries in professor_entries.items():
        supabase.table("timetable_entries").insert({
            "user_id": prof_id,
            "role": "professor",
            "timetable_version_id": version_id,
            "timetable": entries,
        }).execute()
    
    # Insert student timetable entries
    for student_id, entries in student_entries.items():
        supabase.table("timetable_entries").insert({
            "user_id": student_id,
            "role": "student",
            "timetable_version_id": version_id,
            "timetable": entries,
        }).execute()
    
    # Send notifications
    notified_users = set(professor_entries.keys()) | set(student_entries.keys())
    for user_id in notified_users:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "message": f"Your timetable for {term} has been updated.",
        }).execute()
    
    # Update job status
    supabase.table("generation_jobs").insert({
        "job_id": job_id,
        "job_status": "completed",
        "timetable_version_id": version_id,
    }).execute()
    
    return version_id

@app.post("/generate-timetable")
async def generate_timetable(term: str = "Fall 2025"):
    try:
        data = fetch_all_data()
        schedule = run_genetic_algorithm(data)
        job_id = str(uuid.uuid4())
        jobs[job_id] = "running"
        
        version_id = persist_schedule(schedule, job_id, term)
        jobs[job_id] = "completed"

        # Ensure the final response is serializable
        serializable_schedule = convert_to_serializable(schedule)
        
        return {
            "job_id": job_id,
            "status": "completed",
            "timetable_version_id": version_id,
            "schedule": serializable_schedule,
            "term": term,
            "generated_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        job_id = str(uuid.uuid4())
        jobs[job_id] = "failed"
        return {"job_id": job_id, "status": "failed", "error": str(e)}

@app.get("/job/{job_id}")
async def get_job_status(job_id: str):
    status = jobs.get(job_id)
    if status is None:
        job_data = supabase.table("generation_jobs").select("*").eq("job_id", job_id).execute()
        if job_data.data:
            status = job_data.data[0]["job_status"]
            jobs[job_id] = status
        else:
            raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job_id, "status": status}

@app.get("/timetable")
async def get_timetable(user_id: str, role: str, version_id: int = None):
    if version_id:
        timetable_data = supabase.table("timetable_entries").select("*").eq("user_id", user_id).eq("role", role).eq("timetable_version_id", version_id).execute()
    else:
        timetable_data = supabase.table("timetable_entries").select("*").eq("user_id", user_id).eq("role", role).order("timetable_version_id", desc=True).limit(1).execute()
    
    if not timetable_data.data:
        return {"user_id": user_id, "role": role, "timetable": [], "message": "No timetable found"}
    
    return {
        "user_id": user_id,
        "role": role,
        "timetable": timetable_data.data[0]["timetable"],
        "version_id": timetable_data.data[0]["timetable_version_id"]
    }

@app.get("/timetable-versions")
async def get_timetable_versions():
    versions = supabase.table("timetable_versions").select("*").order("generated_at", desc=True).execute()
    return {"versions": convert_to_serializable(versions.data)}