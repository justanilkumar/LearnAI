#!/usr/bin/env python3
"""
Learnify ML & MongoDB PyMongo Pipeline Orchestrator
Executes the end-to-end data extraction, preprocessing, model training, evaluation, and persistence.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from config import get_db
from seed_mongodb import seed_database
from data_pipeline import extract_ml_dataset, get_mongodb_summary_stats
from preprocessing import preprocess_data
from models_classification import train_and_evaluate_classification
from models_regression import train_and_evaluate_regression
from evaluate_and_visualize import (
    format_and_display_results,
    generate_visualizations,
    save_metrics_to_mongodb
)

def main():
    print("=" * 80)
    print(" 🚀 LEARNIFY LMS - MONGODB + PYMONGO MACHINE LEARNING PIPELINE")
    print("=" * 80)

    # 1. Connect to Database
    db, client, is_mock = get_db()

    # 2. Seed Database
    seed_database(db, n_samples=1200)

    # 3. Aggregation & Dataset Extraction
    df = extract_ml_dataset(db)

    # Show MongoDB Aggregation summary stats
    print("\n📊 MongoDB Aggregation Summary (Grouped by Course Category):")
    stats_df = get_mongodb_summary_stats(db)
    print(stats_df.to_string(index=False))

    # 4. Preprocessing & Feature Scaling
    processed_data = preprocess_data(df)

    # 5. Classification Models (Course Completion & Certification)
    class_results, class_models = train_and_evaluate_classification(processed_data)

    # 6. Regression Models (Final Exam Score Prediction)
    reg_results, reg_models = train_and_evaluate_regression(processed_data)

    # 7. Format & Display Results Table
    format_and_display_results(class_results, reg_results)

    # 8. Generate Visualizations & Charts
    output_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts")
    generate_visualizations(class_results, reg_results, class_models, reg_models, processed_data, output_dir=output_dir)

    # 9. Persist Metrics back to MongoDB
    save_metrics_to_mongodb(db, class_results, reg_results)

    print("\n🎉 Pipeline Execution Completed Successfully!")
    print(f"📁 Generated charts and artifacts saved to: {output_dir}")

if __name__ == "__main__":
    main()
