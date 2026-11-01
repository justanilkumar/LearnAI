"""
Model Evaluation, Visualization & MongoDB Metrics Persistence Module
Generates metric tables, plots charts, and stores model artifacts back into MongoDB.
"""
import os
import json
import matplotlib
matplotlib.use('Agg')  # Headless backend for terminal/server execution
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
from tabulate import tabulate

def format_and_display_results(class_results, reg_results):
    print("\n" + "=" * 80)
    print(" 📊 MACHINE LEARNING MODEL EVALUATION SUMMARY")
    print("=" * 80)

    # 1. Classification Table
    class_table_data = []
    for model_name, m in class_results.items():
        class_table_data.append([
            model_name,
            f"{m['Accuracy'] * 100:.2f}%",
            f"{m['Precision'] * 100:.2f}%",
            f"{m['Recall'] * 100:.2f}%",
            f"{m['F1 Score'] * 100:.2f}%",
            f"{m['ROC-AUC']:.4f}"
        ])

    print("\n🔹 CLASSIFICATION TASK: Predicting Student Course Completion & Certification")
    print(tabulate(
        class_table_data,
        headers=["Model", "Accuracy", "Precision", "Recall", "F1 Score", "ROC-AUC"],
        tablefmt="fancy_grid"
    ))

    # 2. Regression Table
    reg_table_data = []
    for model_name, m in reg_results.items():
        reg_table_data.append([
            model_name,
            f"{m['R2 Score']:.4f}",
            f"{m['MAE']:.2f} pts",
            f"{m['MSE']:.2f}",
            f"{m['RMSE']:.2f} pts"
        ])

    print("\n🔹 REGRESSION TASK: Predicting Final Exam / Quiz Score (0 - 100)")
    print(tabulate(
        reg_table_data,
        headers=["Model", "R² Score", "MAE", "MSE", "RMSE"],
        tablefmt="fancy_grid"
    ))
    print("=" * 80 + "\n")

def generate_visualizations(class_results, reg_results, class_models, reg_models, data, output_dir="artifacts"):
    os.makedirs(output_dir, exist_ok=True)
    sns.set_theme(style="darkgrid")

    # 1. Classification Metrics Comparison Bar Chart
    plt.figure(figsize=(10, 6))
    metrics = ["Accuracy", "Precision", "Recall", "F1 Score"]
    models = list(class_results.keys())
    x = np.arange(len(models))
    width = 0.2

    for i, metric in enumerate(metrics):
        values = [class_results[m][metric] for m in models]
        plt.bar(x + i * width, values, width, label=metric)

    plt.xlabel("Classification Models", fontweight='bold', fontsize=12)
    plt.ylabel("Score", fontweight='bold', fontsize=12)
    plt.title("Classification Performance Comparison: Course Completion", fontweight='bold', fontsize=14)
    plt.xticks(x + width * 1.5, models, fontweight='bold')
    plt.ylim(0, 1.1)
    plt.legend(loc='lower right', frameon=True)
    plt.tight_layout()
    class_chart_path = os.path.join(output_dir, "classification_comparison.png")
    plt.savefig(class_chart_path, dpi=300)
    plt.close()

    # 2. Regression Metrics Comparison (R² Score and MAE)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    reg_models_names = list(reg_results.keys())
    r2_vals = [reg_results[m]["R2 Score"] for m in reg_models_names]
    mae_vals = [reg_results[m]["MAE"] for m in reg_models_names]

    # R2 Bar Chart
    bars1 = ax1.bar(reg_models_names, r2_vals, color=['#4f46e5', '#06b6d4', '#10b981'], width=0.5)
    ax1.set_title("R² Score (Higher is Better)", fontweight='bold')
    ax1.set_ylabel("R² Score")
    ax1.set_ylim(0, 1.0)
    for bar in bars1:
        yval = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 0.02, f"{yval:.4f}", ha='center', va='bottom', fontweight='bold')

    # MAE Bar Chart
    bars2 = ax2.bar(reg_models_names, mae_vals, color=['#f59e0b', '#ec4899', '#8b5cf6'], width=0.5)
    ax2.set_title("MAE - Mean Absolute Error (Lower is Better)", fontweight='bold')
    ax2.set_ylabel("MAE (Exam Points)")
    for bar in bars2:
        yval = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 0.1, f"{yval:.2f}", ha='center', va='bottom', fontweight='bold')

    plt.tight_layout()
    reg_chart_path = os.path.join(output_dir, "regression_comparison.png")
    plt.savefig(reg_chart_path, dpi=300)
    plt.close()

    # 3. Random Forest Feature Importance Plot
    rf_reg = reg_models.get("Random Forest")
    if rf_reg and hasattr(rf_reg, "feature_importances_"):
        plt.figure(figsize=(10, 6))
        feat_df = pd.DataFrame({
            "Feature": data["feature_names"],
            "Importance": rf_reg.feature_importances_
        }).sort_values(by="Importance", ascending=True)

        plt.barh(feat_df["Feature"], feat_df["Importance"], color='#6366f1')
        plt.title("Feature Importance: Driving Student Exam Performance (Random Forest)", fontweight='bold', fontsize=13)
        plt.xlabel("Relative Importance")
        plt.tight_layout()
        feat_chart_path = os.path.join(output_dir, "feature_importance.png")
        plt.savefig(feat_chart_path, dpi=300)
        plt.close()

    print(f"📈 Publication-ready visual charts generated in '{output_dir}/'")

def save_metrics_to_mongodb(db, class_results, reg_results):
    """
    Persists evaluation metrics and run metadata back into MongoDB.
    """
    print("💾 Persisting ML Model evaluation results back into MongoDB collection 'ml_model_metrics'...")
    record = {
        "timestamp": pd.Timestamp.utcnow(),
        "classification_metrics": {
            k: {metric: v[metric] for metric in ["Accuracy", "Precision", "Recall", "F1 Score", "ROC-AUC"]}
            for k, v in class_results.items()
        },
        "regression_metrics": {
            k: {metric: v[metric] for metric in ["R2 Score", "MAE", "MSE", "RMSE"]}
            for k, v in reg_results.items()
        }
    }
    db.ml_model_metrics.insert_one(record)
    print("✅ Model metrics successfully recorded in MongoDB collection 'ml_model_metrics'.")
