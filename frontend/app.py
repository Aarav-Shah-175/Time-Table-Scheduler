import streamlit as st
import requests
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:8001")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

st.set_page_config(page_title="Timetable Viewer", layout="wide")


def login():
    st.title("Login")
    email = st.text_input("Email")
    password = st.text_input("Password", type="password")

    if st.button("Login"):
        try:
            res = supabase.auth.sign_in_with_password({"email": email, "password": password})
            if res and res.user:
                st.session_state.user = res.user
                st.success("Login successful")
                st.rerun()   # ✅ instead of experimental_rerun
            else:
                st.error("Invalid email or password")
        except Exception as e:
            st.error(f"Login error: {e}")


def logout():
    if st.button("Logout"):
        supabase.auth.sign_out()
        st.session_state.clear()
        st.rerun()   # ✅ instead of experimental_rerun



def get_user_profile(user_uuid):
    try:
        profile = supabase.table("profiles").select("*").eq("id", user_uuid).single().execute()
        if profile.data:
            return profile.data
    except Exception as e:
        st.error(f"Error fetching profile: {e}")
    return None

def show_admin_page():
    st.header("Admin Panel")
    st.write("Upload CSV and Generate timetable")

    # CSV upload
    csv_file = st.file_uploader("Upload CSV File", type=['csv'])
    data_type = st.selectbox(
        "Select Data Type",
        ["courses", "professors", "students", "enrollments", "classrooms", "timetable_slots", "groups"]
    )
    
    if csv_file and st.button("Upload CSV"):
        files = {'file': (csv_file.name, csv_file, 'text/csv')}
        response = requests.post(f"{BACKEND_API_URL}/upload-csv", params={"data_type": data_type}, files=files)
        if response.ok:
            st.success("CSV uploaded successfully")
        else:
            st.error(f"Upload failed: {response.text}")

    # Generate timetable
    if st.button("Generate Timetable"):
        response = requests.post(f"{BACKEND_API_URL}/generate-timetable", json={"term": "Fall 2025"})
        if response.ok:
            data = response.json()
            st.success("Timetable generated")
            st.json(data)
        else:
            st.error(f"Generation failed: {response.text}")

def render_timetable_schedule(timetable):
    if not timetable:
        st.info("No classes found.")
        return

    st.subheader("📅 Your Timetable")
    for day, classes in timetable.items():
        st.markdown(f"### {day}")
        for c in classes:
            start = c["start_time"]
            end = c["end_time"]
            course = c.get("course_name", f"Course {c['course_id']}")
            classroom = c.get("classroom_name", f"Classroom {c['classroom_id']}")
            professor = c.get("professor_name", f"Prof {c['professor_id']}")

            st.markdown(f"""
            ⏰ {start} - {end}  
            📘 {course} ({c.get("course_code", "")})  
            🏫 {classroom}  
            👨‍🏫 {professor}  
            ---
            """)






def show_timetable(db_user_id, role):
    st.header(f"{role.capitalize()} Timetable")
    params = {"user_id": db_user_id, "role": role}
    response = requests.get(f"{BACKEND_API_URL}/user-timetable", params=params)

    if response.ok:
        data = response.json()
        timetable = data.get("timetable", [])
        if not timetable:
            st.info(data.get("message", "No timetable found."))
            return
        render_timetable_schedule(timetable)
    else:
        st.error(f"Failed to fetch timetable: {response.text}")


def main():
    if "user" not in st.session_state:
        st.session_state.user = None

    if st.session_state.user is None:
        login()
    else:
        st.sidebar.write(f"Logged in as {st.session_state.user.email}")
        logout()

        profile = get_user_profile(st.session_state.user.id)
        if not profile:
            st.error("No profile found for this user.")
            return

        role = profile.get("role")

        if role == "admin":
            show_admin_page()   # ✅ instead of just showing info
        elif role == "student":
            db_user_id = profile.get("student_id")
            if not db_user_id:
                st.error("Profile not linked to student_id")
                return
            show_timetable(db_user_id, "student")
        elif role in ["teacher", "professor"]:
            db_user_id = profile.get("professor_id")
            if not db_user_id:
                st.error("Profile not linked to professor_id")
                return
            show_timetable(db_user_id, "professor")
        else:
            st.warning("Unknown role.")



if __name__ == "__main__":
    main()
