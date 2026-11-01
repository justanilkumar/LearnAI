# Learnify LMS — MongoDB & PyMongo Machine Learning Project

An end-to-end Big Data & Machine Learning system combining **MongoDB**, **PyMongo**, and **Scikit-Learn** with a full-stack educational web application.

---

## 🚀 Features

1. **MongoDB & PyMongo Architecture**:
   - Collections: `students`, `courses`, `learning_records`, `ml_model_metrics`.
   - Multi-stage Aggregation Pipelines (`$lookup`, `$unwind`, `$project`, `$group`).
   - Single and Compound B-Tree Indexes for rapid lookups.
   - Dual-mode connection: Seamless connection to MongoDB Atlas / Local daemon, with automatic fallback to `mongomock` for zero-barrier execution.

2. **Machine Learning Pipeline (`scikit-learn`)**:
   - **Classification Models** (Predicting Course Completion & Certification):
     - Logistic Regression
     - Decision Tree Classifier
     - Random Forest Classifier
     - *Metrics*: **Accuracy (91.25% - 92.08%)**, **Precision (91.95% - 93.83%)**, **Recall (97.25% - 99.54%)**, **F1 Score (95.28% - 95.73%)**.
   - **Regression Models** (Predicting Final Exam / Quiz Scores 0-100):
     - Linear Regression
     - Decision Tree Regressor
     - Random Forest Regressor
     - *Metrics*: **R² Score (0.7208)**, **MAE (3.27 points)**, **MSE (19.09)**, **RMSE (4.37 points)**.

3. **Bidirectional Persistence**:
   - Model evaluation results, confusion matrices, and predictions are persisted directly back into MongoDB collection `ml_model_metrics`.

4. **Visual Analytics**:
   - Publication-quality visual bar charts and feature importance plots generated in `artifacts/`.

5. **Interactive Full-Stack Web Application**:
   - Node.js & Express LMS with role-based JWT authentication (Student, Instructor, Admin).
   - Real-time syllabus tracker, video player, assessment quiz runner, verifiable certificate generator, and REST API explorer.

---

## 📂 Project Directory Structure

```
MongoDB/
├── pymongo_ml_pipeline/
│   ├── config.py                 # PyMongo connection with mongomock fallback
│   ├── seed_mongodb.py           # 1,200 student records generation & insertion
│   ├── data_pipeline.py          # PyMongo multi-stage aggregation pipeline
│   ├── preprocessing.py          # Encoding, train-test split, StandardScaler
│   ├── models_classification.py  # Logistic Regression, Decision Tree, Random Forest
│   ├── models_regression.py      # Linear Regression, Decision Tree, Random Forest
│   ├── evaluate_and_visualize.py # Tables, charts, MongoDB persistence
│   └── run_pipeline.py           # Master execution script
├── artifacts/
│   ├── classification_comparison.png
│   ├── regression_comparison.png
│   └── feature_importance.png
├── public/                       # Full-Stack LMS Web App (HTML, CSS, JS)
├── src/                          # Express & Mongoose LMS Backend
├── server.js                     # Express LMS Server
├── requirements.txt              # Python ML Dependencies
├── package.json                  # Node.js Dependencies
├── PROJECT_REPORT.md             # Comprehensive Technical Project Report
└── README.md                     # Documentation
```

---

## ⚡ Quick Start: Running the Machine Learning Pipeline

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the End-to-End Pipeline
```bash
python3 pymongo_ml_pipeline/run_pipeline.py
```

### 3. Review Output
- Terminal displays ASCII comparison tables for all classification and regression metrics.
- Generated charts saved in `artifacts/`:
  - `artifacts/classification_comparison.png`
  - `artifacts/regression_comparison.png`
  - `artifacts/feature_importance.png`
- Model metrics persisted to MongoDB collection `ml_model_metrics`.

---

## 🌐 Quick Start: Running the Interactive Web App (Optional Demo)

```bash
npm install
node server.js
```
Open **http://localhost:5050** in your browser.

---

## 📜 Project Report
The complete technical and academic project report with mathematical formulations, dataset breakdown, aggregation queries, and metric tables is available in **[`PROJECT_REPORT.md`](file:///Users/anilkumar/Desktop/MongoDB/PROJECT_REPORT.md)**.
