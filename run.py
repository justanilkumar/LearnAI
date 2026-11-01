#!/usr/bin/env python3
"""
Learnify All-in-One Project Runner
Executes the PyMongo Machine Learning Pipeline and launches the Web Application.
"""
import os
import sys
import subprocess
import time
import webbrowser

def main():
    print("=" * 80)
    print(" 🚀 LAUNCHING LEARNIFY: MONGODB + PYMONGO ML & WEB APPLICATION")
    print("=" * 80)

    project_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Run Machine Learning Pipeline
    print("\n[Step 1/2] Running Machine Learning Pipeline (MongoDB + PyMongo)...")
    ml_script = os.path.join(project_dir, "pymongo_ml_pipeline", "run_pipeline.py")
    ret = subprocess.call([sys.executable, ml_script], cwd=project_dir)
    if ret != 0:
        print("⚠️ Warning: ML Pipeline exited with status", ret)

    # 2. Check / Start Web Server
    print("\n[Step 2/2] Checking & Launching Web Application Server on port 5050...")
    # Check if port 5050 is already listening
    import urllib.request
    server_online = False
    try:
        urllib.request.urlopen("http://127.0.0.1:5050/api/health", timeout=2)
        server_online = True
    except Exception:
        server_online = False

    if not server_online:
        print("Starting Express LMS server on http://localhost:5050...")
        subprocess.Popen(["node", "server.js"], cwd=project_dir)
        time.sleep(2)
    else:
        print("✅ Server is already running on http://localhost:5050.")

    print("\n🌐 Opening Learnify LMS in your default browser...")
    webbrowser.open("http://localhost:5050")

    print("""
================================================================================
  🎓 Learnify LMS is LIVE!
================================================================================
  • Web App Dashboard:     http://localhost:5050
  • Explore Courses:       http://localhost:5050#courses
  • Student Portal:        http://localhost:5050#student
  • Instructor Studio:     http://localhost:5050#instructor
  • Certificate Verifier:  http://localhost:5050#verify
  • REST API Docs:         http://localhost:5050#api-docs
  • ML Visual Charts:      artifacts/
  • Project Report:        PROJECT_REPORT.md
  • Download Package:      Learnify_MongoDB_ML_Project_Report.zip
================================================================================
    """)

if __name__ == "__main__":
    main()
