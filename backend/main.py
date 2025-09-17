import os
import csv
import io
import uuid
from datetime import datetime, time, date
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client, Client
from dotenv import load_dotenv
import random
from fastapi import Query

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError("Missing Supabase environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI()

jobs = {}

origins = [
    "http://localhost",
    "http://localhost:3000", # The default URL for Next.js/React frontends
    # Add the URL of your deployed V0 frontend here if you have one
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

def convert_to_serializable(obj):
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

@app.get("/user-timetable")
async def user_timetable(user_id: int, role: str):
    # 1. Get latest timetable version
    versions_resp = supabase.table("timetable_versions")\
        .select("*").order("generated_at", desc=True).limit(1).execute()
    if not versions_resp.data:
        return {"error": "No timetable generated yet"}
    latest_version_id = versions_resp.data[0]["id"]

    # 2. Fetch timetable entries for this user
    entries_resp = supabase.table("timetable_entries")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("role", role)\
        .eq("timetable_version_id", latest_version_id)\
        .limit(1).execute()

    if not entries_resp.data:
        return {
            "user_id": user_id,
            "role": role,
            "timetable": [],
            "message": "No timetable entries found for this user"
        }

    timetable = entries_resp.data[0]["timetable"]

    # 3. Fetch reference data to enrich timetable
    ref_data = fetch_all_data()
    courses_info = {c['id']: c for c in ref_data['courses']}
    classrooms_info = {c['id']: c['name'] for c in ref_data['classrooms']}
    professors_info = {p['id']: p['name'] for p in ref_data['professors']}

    # 4. Enrich with names
    for row in timetable:
        row["course_name"] = courses_info.get(row["course_id"], {}).get("name", "")
        row["course_code"] = courses_info.get(row["course_id"], {}).get("code", "")
        row["classroom_name"] = classrooms_info.get(row["classroom_id"], "")
        row["professor_name"] = professors_info.get(row["professor_id"], "")

    # 5. Group by day + sort by start_time
    day_order = {"Monday": 1, "Tuesday": 2, "Wednesday": 3,
                 "Thursday": 4, "Friday": 5, "Saturday": 6}

    grouped = {}
    for row in timetable:
        day = row["day"]
        grouped.setdefault(day, []).append(row)

    for day in grouped:
        grouped[day].sort(key=lambda x: x["start_time"])
    sorted_days = dict(sorted(grouped.items(), key=lambda x: day_order.get(x[0], 99)))

    return {
        "user_id": user_id,
        "role": role,
        "timetable_version_id": latest_version_id,
        "timetable": sorted_days
    }





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

    # Conflict: professors or classrooms overlap
    for i in range(len(schedule)):
        for j in range(i + 1, len(schedule)):
            a, b = schedule[i], schedule[j]
            if a['professor_id'] == b['professor_id'] and time_slots_conflict(a, b):
                conflicts += 50
            if a['classroom_id'] == b['classroom_id'] and time_slots_conflict(a, b):
                conflicts += 50

    # Build student course mapping
    enrollments = data['enrollments']
    student_courses = {}
    for e in enrollments:
        student_courses.setdefault(e['student_id'], []).append(e['course_id'])

    # Student constraint: no same subject twice a day
    for entry in schedule:
        course = entry['course_id']
        day = entry['day']
        for student_id, courses in student_courses.items():
            if course in courses:
                key = (student_id, course, day)
                # Count how many times this student has the same course on same day
                occurrences = sum(
                    1 for e in schedule if e['course_id'] == course and e['day'] == day
                )
                if occurrences > 1:
                    conflicts += 30 * (occurrences - 1)

    # Professor load distribution
    prof_day_hours = {}
    prof_week_hours = {}

    for entry in schedule:
        key = (entry['professor_id'], entry['day'])
        prof_day_hours[key] = prof_day_hours.get(key, 0) + 1
        prof_week_hours[entry['professor_id']] = prof_week_hours.get(entry['professor_id'], 0) + 1

    for (prof, day), hours in prof_day_hours.items():
        if hours > 5:  # more than 5 hours in a single day
            conflicts += (hours - 5) * 20

    for prof, total_hours in prof_week_hours.items():
        diff = abs(20 - total_hours)
        conflicts += diff * 5

    return conflicts



def generate_random_schedule(data):
    schedule = []
    for course in data['courses']:
        prof = random.choice(data['professors'])
        room = random.choice(data['classrooms'])
        credits = course.get('credits', 3) if 'credits' in course else 3
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
    serializable_schedule = convert_to_serializable(schedule)

    version_resp = supabase.table("timetable_versions").insert({
        "term": term,
        "generated_at": datetime.utcnow().isoformat(),
        "job_id": job_id,
    }).execute()

    if not version_resp.data:
        raise Exception("Failed to create timetable version")

    version_id = version_resp.data[0]["id"]

    supabase.table("schedule_rows").delete().eq("timetable_version_id", version_id).execute()

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

    insert_resp = supabase.table("schedule_rows").insert(bulk_data).execute()
    if not insert_resp.data:
        raise Exception("Failed to insert schedule rows")

    professor_entries = {}
    for entry in bulk_data:
        prof = entry["professor_id"]
        if prof not in professor_entries:
            professor_entries[prof] = []
        professor_entries[prof].append(entry)

    enrollments = supabase.table("enrollments").select("*").execute().data
    student_courses = {}
    for e in enrollments:
        student_courses.setdefault(e["student_id"], []).append(e["course_id"])

    student_entries = {}
    for student_id, courses in student_courses.items():
        entries = [e for e in bulk_data if e["course_id"] in courses]
        if entries:
            student_entries[student_id] = entries

    for prof_id, entries in professor_entries.items():
        supabase.table("timetable_entries").insert({
            "user_id": prof_id,
            "role": "professor",
            "timetable_version_id": version_id,
            "timetable": entries,
        }).execute()

    for student_id, entries in student_entries.items():
        supabase.table("timetable_entries").insert({
            "user_id": student_id,
            "role": "student",
            "timetable_version_id": version_id,
            "timetable": entries,
        }).execute()

    notified_users = set(professor_entries.keys()) | set(student_entries.keys())
    for user_id in notified_users:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "message": f"Your timetable for {term} has been updated.",
        }).execute()

    supabase.table("generation_jobs").insert({
        "job_id": job_id,
        "job_status": "completed",
        "timetable_version_id": version_id,
    }).execute()

    return version_id


@app.post("/generate-timetable")
async def generate_timetable(term: str = Query("Fall 2025"), force_regenerate: bool = Query(False)):
    # Check if timetable for term already exists
    existing_versions = supabase.table("timetable_versions").select("*").eq("term", term).order("generated_at", desc=True).limit(1).execute()
    if existing_versions.data and not force_regenerate:
        version = existing_versions.data[0]
        version_id = version["id"]
        job_id = version["job_id"]
        # Fetch transformed schedule from schedule_rows
        schedule_rows = supabase.table("schedule_rows").select("*").eq("timetable_version_id", version_id).execute().data
        ref_data = fetch_all_data()
        transformed_schedule = transform_schedule(schedule_rows, ref_data)

        return {
            "job_id": job_id,
            "status": "cached",
            "timetable_version_id": version_id,
            "term": term,
            "generated_at": version["generated_at"],
            **transformed_schedule
        }

    # Otherwise generate new timetable and persist
    try:
        data = fetch_all_data()
        schedule = run_genetic_algorithm(data)
        job_id = str(uuid.uuid4())
        jobs[job_id] = "running"

        version_id = persist_schedule(schedule, job_id, term)
        jobs[job_id] = "completed"

        transformed_schedule = transform_schedule(schedule, data)
        serializable_schedule = convert_to_serializable(transformed_schedule)

        return {
            "job_id": job_id,
            "status": "completed",
            "timetable_version_id": version_id,
            "term": term,
            "generated_at": datetime.utcnow().isoformat(),
            **serializable_schedule
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
    # For students, get courses they are enrolled in
    if role == "student":
        enrollments = supabase.table("enrollments").select("course_id").eq("student_id", user_id).execute().data
        enrolled_courses = list(set(e['course_id'] for e in enrollments)) if enrollments else []
        if not enrolled_courses:
            return {"user_id": user_id, "role": role, "timetable": {}, "message": "No enrolled courses found"}

        query = supabase.table("schedule_rows").select("*").in_("course_id", enrolled_courses)
        if version_id:
            query = query.eq("timetable_version_id", version_id)

        schedule_data = query.execute().data or []

    # For teachers, get schedule rows assigned
    elif role == "professor" or role == "teacher":
        query = supabase.table("schedule_rows").select("*").eq("professor_id", user_id)
        if version_id:
            query = query.eq("timetable_version_id", version_id)

        schedule_data = query.execute().data or []

    # For admin or others, optionally return full schedule or error
    else:
        return {"error": f"Role '{role}' not supported for timetable"}

    # Fetch reference data to enhance the timetable display
    ref_data = fetch_all_data()
    transformed_schedule = transform_schedule(schedule_data, ref_data)

    return {
        "user_id": user_id,
        "role": role,
        "timetable": transformed_schedule['schedule'],
        "summary": transformed_schedule['summary']
    }



@app.get("/timetable-versions")
async def get_timetable_versions():
    versions = supabase.table("timetable_versions").select("*").order("generated_at", desc=True).execute()
    return {"versions": convert_to_serializable(versions.data)}


def transform_schedule(schedule, data):
    courses_info = {c['id']: c for c in data['courses']}
    classrooms_info = {c['id']: c['name'] for c in data['classrooms']}
    professors_info = {p['id']: p['name'] for p in data['professors']}

    output = {}
    total_classes = 0

    # Define day order for sorting
    day_order = {"Monday": 1, "Tuesday": 2, "Wednesday": 3,
                 "Thursday": 4, "Friday": 5, "Saturday": 6}

    for entry in schedule:
        day = entry['day']
        start_time = entry['start_time']
        end_time = entry['end_time']
        course_id = entry['course_id']
        classroom_id = entry['classroom_id']
        professor_id = entry['professor_id']

        course = courses_info.get(course_id, {})
        course_code = course.get('code', '')
        course_name = course.get('name', '')

        if day not in output:
            output[day] = []

        # Find or create time slot
        time_slot_dict = next(
            (ts for ts in output[day]
             if ts['time_slot']['start_time'] == start_time
             and ts['time_slot']['end_time'] == end_time),
            None
        )
        if time_slot_dict is None:
            time_slot_dict = {
                'time_slot': {'start_time': start_time, 'end_time': end_time},
                'courses': []
            }
            output[day].append(time_slot_dict)

        # Find or create course entry
        course_group = next(
            (c for c in time_slot_dict['courses'] if c['course_code'] == course_code),
            None
        )
        if course_group is None:
            course_group = {
                'course_code': course_code,
                'course_name': course_name,
                'sections': []
            }
            time_slot_dict['courses'].append(course_group)

        # Append classroom + professor info
        course_group['sections'].append({
            'classroom': classrooms_info.get(classroom_id, ''),
            'faculty': professors_info.get(professor_id, '')
        })

        total_classes += 1

    # ✅ Sort days and time slots
    sorted_output = dict(sorted(output.items(), key=lambda x: day_order.get(x[0], 99)))
    for day in sorted_output:
        sorted_output[day].sort(key=lambda ts: ts['time_slot']['start_time'])

    return {
        'schedule': sorted_output,
        'summary': {'total_classes_scheduled': total_classes}
    }

