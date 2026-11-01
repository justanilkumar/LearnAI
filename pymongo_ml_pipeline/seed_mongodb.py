"""
Database Seeding Module using PyMongo
Populates collections: students, courses, and learning_records.
"""
import numpy as np
from datetime import datetime, timedelta

def seed_database(db, n_samples=1200, random_seed=42):
    np.random.seed(random_seed)
    print(f"🌱 Seeding {n_samples} learning records into MongoDB via PyMongo...")

    # Drop previous collections if any
    db.students.drop()
    db.courses.drop()
    db.learning_records.drop()

    # 1. Seed Courses
    courses_data = [
        {"course_id": "C101", "title": "MongoDB & Mongoose Architecture", "category": "Database", "difficulty": "Intermediate", "duration_hours": 20},
        {"course_id": "C102", "title": "Scalable REST APIs with Node & Express", "category": "Backend", "difficulty": "Advanced", "duration_hours": 25},
        {"course_id": "C103", "title": "Data Structures & Algorithmic Thinking", "category": "Algorithms", "difficulty": "Intermediate", "duration_hours": 30},
        {"course_id": "C104", "title": "Machine Learning Foundations with Python", "category": "Data Science", "difficulty": "Beginner", "duration_hours": 18},
        {"course_id": "C105", "title": "Cloud Native Microservices & Docker", "category": "DevOps", "difficulty": "Advanced", "duration_hours": 22}
    ]
    db.courses.insert_many(courses_data)

    # 2. Seed Students and Learning Activity Records
    education_levels = ["High School", "Bachelor", "Master", "PhD"]
    edu_weights = [0.20, 0.55, 0.20, 0.05]

    students_list = []
    records_list = []

    course_ids = [c["course_id"] for c in courses_data]

    for i in range(1, n_samples + 1):
        s_id = f"STU_{i:04d}"
        edu = np.random.choice(education_levels, p=edu_weights)
        age = int(np.random.normal(24, 4))
        age = max(18, min(age, 45))
        prior_exp_months = max(0, int(np.random.exponential(12)))

        students_list.append({
            "student_id": s_id,
            "name": f"Student_{i}",
            "email": f"student_{i}@learnify.edu",
            "education_level": edu,
            "age": age,
            "prior_experience_months": prior_exp_months,
            "registered_at": datetime.utcnow() - timedelta(days=int(np.random.uniform(30, 365)))
        })

        # Synthetic feature generation with realistic correlations
        c_id = np.random.choice(course_ids)
        
        # Core engagement metrics
        study_hours = max(1.0, np.random.normal(12.5, 5.0))
        attendance_pct = max(20.0, min(100.0, np.random.normal(78.0, 16.0)))
        video_completion_pct = max(10.0, min(100.0, attendance_pct * 0.9 + np.random.normal(5.0, 8.0)))
        assignments_done = max(0, min(10, int(np.random.normal(7.5, 2.2))))
        quiz_attempts = max(1, int(np.random.poisson(4)))
        forum_posts = max(0, int(np.random.exponential(3)))

        # Target 1: Quiz / Exam Score (Regression target, 0 - 100)
        raw_score = (
            30.0
            + 1.65 * study_hours
            + 0.22 * attendance_pct
            + 0.18 * video_completion_pct
            + 1.9 * assignments_done
            + 0.25 * min(prior_exp_months, 36)
            + np.random.normal(0, 5.2)
        )
        final_score = round(max(20.0, min(100.0, raw_score)), 2)

        # Target 2: Course Completion (Balanced ~68% completed, ~32% incomplete)
        comp_logit = (final_score - 70.0) / 9.5 + (video_completion_pct - 60.0) / 20.0 + (assignments_done - 6.5) * 0.35
        comp_prob = 1.0 / (1.0 + np.exp(-comp_logit))
        completed = int(np.random.rand() < comp_prob)
        certified = 1 if (completed == 1 and final_score >= 65.0) else 0

        records_list.append({
            "record_id": f"REC_{i:04d}",
            "student_id": s_id,
            "course_id": c_id,
            "study_hours_per_week": round(study_hours, 2),
            "attendance_rate": round(attendance_pct, 2),
            "video_completion_rate": round(video_completion_pct, 2),
            "assignments_submitted": assignments_done,
            "quiz_attempts_count": quiz_attempts,
            "forum_posts_count": forum_posts,
            "final_exam_score": final_score,
            "completed": completed,
            "certified": certified,
            "created_at": datetime.utcnow()
        })

    # Bulk Insert into MongoDB
    db.students.insert_many(students_list)
    db.learning_records.insert_many(records_list)

    # Create PyMongo Indexes for optimized performance
    db.students.create_index("student_id", unique=True)
    db.learning_records.create_index([("student_id", 1), ("course_id", 1)])
    db.learning_records.create_index("completed")
    db.learning_records.create_index("final_exam_score")

    print(f"✅ Seeding Complete: {len(students_list)} students, {len(courses_data)} courses, {len(records_list)} learning records stored in MongoDB.")
    return True
