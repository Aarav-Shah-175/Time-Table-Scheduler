import os
import csv
import io
import uuid
from datetime import datetime
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

@app.get("/")
async def root():
    return {"message": "Welcome to Smart Timetable Scheduler API"}

@app.post("/upload-csv")
async def upload_csv(data_type: str, file: UploadFile = File(...)):
    # ... existing CSV upload code from previous messages ...
    # (for brevity, reuse the previously provided upload_csv implementation)
    pass

def fetch_all_data():
    # Fetch all pertinent scheduling data from Supabase
    courses = supabase.table("courses").select("*").execute().data
    professors = supabase.table("professors").select("*").execute().data
    classrooms = supabase.table("classrooms").select("*").execute().data
    timetable_slots = supabase.table("timetable_slots").select("*").execute().data
    groups = supabase.table("groups").select("*").execute().data
    group_students = supabase.table("group_students").select("*").execute().data

    return {
        "courses": courses,
        "professors": professors,
        "classrooms": classrooms,
        "timetable_slots": timetable_slots,
        "groups": groups,
        "group_students": group_students,
    }

# Helper function: Check if two time slots clash
def time_slots_conflict(slot1, slot2):
    if slot1['day'] != slot2['day']:
        return False
    # Assuming time format HH:MM:SS strings
    return max(slot1['start_time'], slot2['start_time']) < min(slot1['end_time'], slot2['end_time'])

# Fitness function for GA: count conflicts in schedule
def fitness(schedule):
    conflicts = 0
    # Check for professor conflicts and room conflicts etc.
    for i in range(len(schedule)):
        for j in range(i + 1, len(schedule)):
            a = schedule[i]
            b = schedule[j]
            if a['professor_id'] == b['professor_id'] and time_slots_conflict(a, b):
                conflicts += 1
            if a['classroom_id'] == b['classroom_id'] and time_slots_conflict(a, b):
                conflicts += 1

            # Additional checks (e.g., student conflicts) can be added here
    return conflicts

# Generate a random schedule (chromosome)
def generate_random_schedule(data):
    schedule = []
    for course in data['courses']:
        prof = random.choice(data['professors'])
        room = random.choice(data['classrooms'])
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

# Genetic Algorithm main loop (simplified)
def run_genetic_algorithm(data, population_size=50, generations=100):
    population = [generate_random_schedule(data) for _ in range(population_size)]
    best_schedule = None
    best_fitness = float('inf')

    for _ in range(generations):
        # Evaluate fitness
        scored = [(fitness(schedule), schedule) for schedule in population]
        scored.sort(key=lambda x: x[0])

        # Select best
        best_current_fitness, best_current_schedule = scored[0]
        if best_current_fitness < best_fitness:
            best_fitness = best_current_fitness
            best_schedule = best_current_schedule
            if best_fitness == 0:
                break  # Perfect schedule found

        # Simple crossover and mutation to create next gen
        next_gen = scored[:population_size // 2]  # Top 50%
        new_population = [s for _, s in next_gen]

        while len(new_population) < population_size:
            parent1 = random.choice(new_population)
            parent2 = random.choice(new_population)
            child = []

            # Single point crossover
            crossover_point = len(parent1) // 2
            child.extend(parent1[:crossover_point])
            child.extend(parent2[crossover_point:])

            # Mutation: randomly change one assignment
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

@app.post("/generate-timetable")
async def generate_timetable():
    data = fetch_all_data()
    schedule = run_genetic_algorithm(data)
    job_id = str(uuid.uuid4())
    jobs[job_id] = "completed"
    # Save schedule to DB or cache if needed (optional)

    return {"job_id": job_id, "status": "completed", "schedule": schedule}
