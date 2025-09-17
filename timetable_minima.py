# scheduler_minimal.py
# Minimal OR-Tools CP-SAT timetable example (hierarchical output)
from ortools.sat.python import cp_model
from collections import defaultdict

# -----------------------
# Mock data (small demo)
# -----------------------
timeslots = [
    {"slot_index": 0, "day": "Monday",    "time_label": "09:00-10:00"},
    {"slot_index": 1, "day": "Monday",    "time_label": "10:00-11:00"},
    {"slot_index": 2, "day": "Tuesday",   "time_label": "09:00-10:00"},
    {"slot_index": 3, "day": "Tuesday",   "time_label": "10:00-11:00"},
]

rooms = [
    {"room_id": "R101", "type": "class", "capacity": 30, "available_slots": [0,1,2,3]},
    {"room_id": "Lab1", "type": "lab",   "capacity": 20, "available_slots": [0,1,2,3]},
]

courses = [
    {"course_id": "CSE101", "hours_per_week": 2, "needs_lab": False},
    {"course_id": "PHY102", "hours_per_week": 1, "needs_lab": True},
]

faculties = [
    {"faculty_id": "P1", "name": "Prof Sharma", "available_slots": [0,1,2,3], "courses": ["CSE101"]},
    {"faculty_id": "P2", "name": "Prof Rao",    "available_slots": [0,2,3],   "courses": ["PHY102"]},
]

# enrollments: student -> course -> faculty (student is assigned under a faculty for that course)
enrollments = []
# 20 students for CSE101 under P1
for i in range(1, 21):
    enrollments.append({"student_id": f"S{i}", "course_id": "CSE101", "faculty_id": "P1"})
# 8 students for PHY102 under P2
for i in range(21, 29):
    enrollments.append({"student_id": f"S{i}", "course_id": "PHY102", "faculty_id": "P2"})

# -----------------------
# Build groups: (course, faculty) -> students
# -----------------------
groups = {}  # key=(course,faculty) -> {'students':[], 'group_size':int, 'required_slots':int}
for e in enrollments:
    key = (e["course_id"], e["faculty_id"])
    groups.setdefault(key, {"course_id": e["course_id"], "faculty_id": e["faculty_id"], "students": []})
    groups[key]["students"].append(e["student_id"])

# finalize required_slots from course hours_per_week
for key, g in groups.items():
    course_id = g["course_id"]
    course = next(c for c in courses if c["course_id"] == course_id)
    g["group_size"] = len(g["students"])
    g["required_slots"] = int(course.get("hours_per_week", 1))  # 1 slot = 1 hour

# index lists for iteration
group_list = list(groups.items())  # [ ((course,fac), {...}), ... ]
group_index = { key: idx for idx, (key, _) in enumerate(group_list) }
num_groups = len(group_list)
num_slots = len(timeslots)
num_rooms = len(rooms)

# -----------------------
# Build CP-SAT model
# -----------------------
model = cp_model.CpModel()

# create boolean vars x[g_idx, s, r] only for feasible combos
x = {}  # key -> BoolVar
for g_idx, (key, g) in enumerate(group_list):
    course_id, faculty_id = key
    # faculty availability
    faculty = next(f for f in faculties if f["faculty_id"] == faculty_id)
    fac_avail = set(faculty.get("available_slots", []))
    # course needs lab?
    course = next(c for c in courses if c["course_id"] == course_id)
    needs_lab = course.get("needs_lab", False)

    # candidate rooms filtered by capacity and type
    candidate_rooms = []
    for r_idx, room in enumerate(rooms):
        if needs_lab and room["type"] != "lab":
            continue
        if room["capacity"] < g["group_size"]:
            continue
        candidate_rooms.append(r_idx)

    for slot in timeslots:
        s = slot["slot_index"]
        if s not in fac_avail:
            continue
        for r_idx in candidate_rooms:
            if s not in rooms[r_idx]["available_slots"]:
                continue
            var = model.NewBoolVar(f"x_g{g_idx}_s{s}_r{r_idx}")
            x[(g_idx, s, r_idx)] = var

# Constraint: each group must be scheduled exactly required_slots times
for g_idx, (key, g) in enumerate(group_list):
    vars_for_g = [v for (gi, s, r), v in x.items() if gi == g_idx]
    model.Add(sum(vars_for_g) == g["required_slots"])

# Constraint: faculty cannot teach >1 room in same slot
from collections import defaultdict
faculty_to_groups = defaultdict(list)
for g_idx, (key, g) in enumerate(group_list):
    _, faculty_id = key
    faculty_to_groups[faculty_id].append(g_idx)

for faculty_id, g_indices in faculty_to_groups.items():
    for s in range(num_slots):
        sum_vars = []
        for gi in g_indices:
            for r in range(num_rooms):
                v = x.get((gi, s, r))
                if v is not None:
                    sum_vars.append(v)
        if sum_vars:
            model.Add(sum(sum_vars) <= 1)

# Constraint: room occupancy <=1 per slot
for r in range(num_rooms):
    for s in range(num_slots):
        sum_vars = [v for (gi, ss, rr), v in x.items() if rr == r and ss == s]
        if sum_vars:
            model.Add(sum(sum_vars) <= 1)

# Constraint: student conflict (each student <=1 assignment per slot)
student_to_groups = defaultdict(list)
for g_idx, (key, g) in enumerate(group_list):
    for sid in g["students"]:
        student_to_groups[sid].append(g_idx)

for sid, g_indices in student_to_groups.items():
    for s in range(num_slots):
        sum_vars = []
        for gi in g_indices:
            for r in range(num_rooms):
                v = x.get((gi, s, r))
                if v is not None:
                    sum_vars.append(v)
        if sum_vars:
            model.Add(sum(sum_vars) <= 1)

# Objective: minimize total used assignments (compact schedule)
all_vars = list(x.values())
model.Minimize(sum(all_vars))

# -----------------------
# Solve
# -----------------------
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 10
solver.parameters.num_search_workers = 8

print("Solving...")
status = solver.Solve(model)

if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
    print("Solution found. Extracting timetable...\n")
    # hierarchical structure: (day, time) -> course -> list(groups)
    output = defaultdict(lambda: defaultdict(list))
    for (g_idx, s, r_idx), var in x.items():
        if solver.Value(var) == 1:
            key, g = group_list[g_idx]
            course_id, faculty_id = key
            slot_info = next(t for t in timeslots if t["slot_index"] == s)
            day = slot_info["day"]
            slot_label = slot_info["time_label"]
            room_id = rooms[r_idx]["room_id"]
            output[(day, slot_label)][course_id].append({
                "room": room_id,
                "faculty_id": faculty_id,
                "students": g["students"]
            })

    # Pretty print:
    for (day, slot_label), courses_map in sorted(output.items()):
        print(f"--- {day} | {slot_label} ---")
        for course_id, groups_list in courses_map.items():
            print(f"Course: {course_id}")
            for grp in groups_list:
                print(f"  Room: {grp['room']}  |  Faculty: {grp['faculty_id']}  |  #students: {len(grp['students'])}")
                # print student list shortened
                print(f"    Students: {', '.join(grp['students'][:8])}" + (", ..." if len(grp['students']) > 8 else ""))
        print()
else:
    print("No feasible solution found. Status:", status)
    print("Consider relaxing constraints or increasing solver time.")