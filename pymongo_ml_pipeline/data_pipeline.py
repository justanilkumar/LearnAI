"""
PyMongo Data Pipeline & Aggregation Module
Extracts and joins data across MongoDB collections using Aggregation Pipelines.
"""
import pandas as pd

def extract_ml_dataset(db):
    """
    Executes a multi-stage MongoDB aggregation pipeline to join
    learning_records, students, and courses into a consolidated feature set.
    """
    pipeline = [
        # Stage 1: Join with students collection
        {
            "$lookup": {
                "from": "students",
                "localField": "student_id",
                "foreignField": "student_id",
                "as": "student"
            }
        },
        {"$unwind": "$student"},

        # Stage 2: Join with courses collection
        {
            "$lookup": {
                "from": "courses",
                "localField": "course_id",
                "foreignField": "course_id",
                "as": "course"
            }
        },
        {"$unwind": "$course"},

        # Stage 3: Project features for ML modeling
        {
            "$project": {
                "_id": 0,
                "student_id": 1,
                "course_id": 1,
                "course_category": "$course.category",
                "course_difficulty": "$course.difficulty",
                "course_duration_hours": "$course.duration_hours",
                "education_level": "$student.education_level",
                "age": "$student.age",
                "prior_experience_months": "$student.prior_experience_months",
                "study_hours_per_week": 1,
                "attendance_rate": 1,
                "video_completion_rate": 1,
                "assignments_submitted": 1,
                "quiz_attempts_count": 1,
                "forum_posts_count": 1,
                # ML Targets
                "final_exam_score": 1,  # Regression Target
                "completed": 1,         # Classification Target
                "certified": 1
            }
        }
    ]

    print("🔍 Executing PyMongo aggregation pipeline ($lookup -> $unwind -> $project)...")
    results = list(db.learning_records.aggregate(pipeline))
    df = pd.DataFrame(results)
    print(f"📊 Extracted {len(df)} records with {df.shape[1]} features from MongoDB.")
    return df

def get_mongodb_summary_stats(db):
    """
    PyMongo aggregation queries for report insights (grouping & stats).
    """
    category_pipeline = [
        {
            "$lookup": {
                "from": "courses",
                "localField": "course_id",
                "foreignField": "course_id",
                "as": "course"
            }
        },
        {"$unwind": "$course"},
        {
            "$group": {
                "_id": "$course.category",
                "total_enrollments": {"$sum": 1},
                "avg_exam_score": {"$avg": "$final_exam_score"},
                "completion_rate": {"$avg": "$completed"}
            }
        },
        {"$sort": {"total_enrollments": -1}}
    ]

    stats = list(db.learning_records.aggregate(category_pipeline))
    return pd.DataFrame(stats)
