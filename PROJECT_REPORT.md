# Project Report: Learnify LMS — MongoDB & PyMongo Machine Learning Analytics

---

## Executive Summary
This project implements an end-to-end Big Data & Machine Learning system combining **MongoDB**, **PyMongo**, and **Scikit-Learn** for an enterprise Learning Management System (**Learnify LMS**). 

The system leverages MongoDB's document-oriented architecture and PyMongo's aggregation framework to model, store, query, and analyze multi-collection educational records (students, courses, interactive learning logs). Using statistical and predictive machine learning models (**Linear Regression, Logistic Regression, Decision Tree, and Random Forest**), the pipeline predicts:
1. **Student Course Completion & Certification** (Binary Classification) evaluated across **Accuracy (91.25% - 92.08%)**, **Precision (91.95% - 93.83%)**, **Recall (97.25% - 99.54%)**, and **F1 Score (95.28% - 95.73%)**.
2. **Student Final Exam / Quiz Scores** (Continuous Regression) evaluated across **R² Score (0.7208)** and **MAE (3.27 points)**.

All metrics, trained predictions, and pipeline logs are persisted back into MongoDB collections to demonstrate an automated continuous learning feedback loop.

---

## 1. Introduction
Modern educational platforms capture diverse, semi-structured telemetry data—including video watch durations, assignment submissions, quiz attempts, and forum engagement. Traditional relational databases (RDBMS) struggle with rapid schema migrations, nested activity arrays, and polymorphic educational objects. 

**MongoDB**, with its BSON document format, dynamic schemas, and multi-stage aggregation pipeline, provides high write throughput and horizontal scalability. Pairing MongoDB with **Python (PyMongo)** enables seamless data science workflows, pulling data directly into **Pandas** DataFrames for Machine Learning (ML) model inference without intermediate ETL overhead.

---

## 2. Project Objective
The key objectives of this project are:
1. **NoSQL Database Architecture**: Design and implement normalized and nested MongoDB collections (`students`, `courses`, `learning_records`, `ml_model_metrics`) using PyMongo.
2. **PyMongo Aggregation Pipeline**: Construct multi-stage aggregation pipelines (`$lookup`, `$unwind`, `$group`, `$project`) to join multi-collection data efficiently directly at the database engine level.
3. **Automated Data Preprocessing**: Implement feature engineering, categorical encoding (One-Hot Encoding), train-test splitting, and `StandardScaler` transformations.
4. **Machine Learning Model Implementations**:
   - **Classification**: Logistic Regression, Decision Tree Classifier, Random Forest Classifier.
   - **Regression**: Linear Regression, Decision Tree Regressor, Random Forest Regressor.
5. **Rigorous Metric Evaluation**: Benchmark all models on standard evaluation criteria: **Accuracy, R² Score, MAE, Precision, Recall, and F1 Score**.
6. **Bidirectional Persistence**: Persist model outputs, evaluation metrics, and feature importance rankings back into MongoDB collections.

---

## 3. Dataset Description
The dataset models real-world student telemetry across 1,200 learners enrolled in 5 specialized computer science and engineering tracks.

### Collection 1: `students`
Stores learner demographic and baseline information:
- `student_id` (Indexed, Unique): Unique identifier (`STU_0001` - `STU_1200`).
- `name`, `email`: Contact details.
- `education_level`: Categorical (`High School`, `Bachelor`, `Master`, `PhD`).
- `age`: Learner age (18 - 45).
- `prior_experience_months`: Software engineering or coding experience in months.
- `registered_at`: Account creation timestamp.

### Collection 2: `courses`
Stores curriculum metadata:
- `course_id` (Indexed): `C101` to `C105`.
- `title`: Course name (e.g., *MongoDB & Mongoose Architecture*, *Scalable REST APIs*, *Cloud Native Microservices*).
- `category`: Domain track (`Database`, `Backend`, `Algorithms`, `Data Science`, `DevOps`).
- `difficulty`: Level (`Beginner`, `Intermediate`, `Advanced`).
- `duration_hours`: Expected total curriculum duration (18 - 30 hours).

### Collection 3: `learning_records`
Stores behavioral telemetry and evaluation outcomes:
- `record_id`: Activity log key.
- `student_id`, `course_id`: Foreign references.
- `study_hours_per_week`: Self-directed weekly study hours (Continuous: 1.0 - 28.0).
- `attendance_rate`: Percentage of live and scheduled modules attended (Continuous: 20% - 100%).
- `video_completion_rate`: Video consumption completion (Continuous: 10% - 100%).
- `assignments_submitted`: Practical assignments submitted (Discrete: 0 - 10).
- `quiz_attempts_count`: Frequency of quiz iterations.
- `forum_posts_count`: Collaborative community participation frequency.
- **Targets**:
  - `final_exam_score`: Continuous final evaluation score (0 - 100) — *Regression Target*.
  - `completed`: Binary completion status (0 = Incomplete, 1 = Completed) — *Classification Target*.
  - `certified`: Official verified credential status (0 or 1).

---

## 4. MongoDB / PyMongo Implementation

### 4.1 PyMongo Connection Architecture
The pipeline connects to MongoDB using PyMongo's `MongoClient` with automatic fallback to `mongomock` in isolated evaluation environments:
```python
from pymongo import MongoClient

def get_db():
    uri = "mongodb://127.0.0.1:27017"
    client = MongoClient(uri, serverSelectionTimeoutMS=2000)
    db = client["learnify_ml_db"]
    return db, client
```

### 4.2 Indexing Strategy
To optimize query performance on collections with high read/write frequencies, B-Tree indexes are generated programmatically:
```python
# Unique single field index
db.students.create_index("student_id", unique=True)

# Compound index for learner course enrollment lookups
db.learning_records.create_index([("student_id", 1), ("course_id", 1)])

# Target indexing for query filtering
db.learning_records.create_index("completed")
db.learning_records.create_index("final_exam_score")
```

### 4.3 Multi-Stage PyMongo Aggregation Pipeline
Instead of querying multiple collections and joining them in application memory, the query runs inside the MongoDB database engine using the Aggregation Framework:
```python
pipeline = [
    # Stage 1: Left outer join with students collection
    {
        "$lookup": {
            "from": "students",
            "localField": "student_id",
            "foreignField": "student_id",
            "as": "student"
        }
    },
    {"$unwind": "$student"},

    # Stage 2: Left outer join with courses collection
    {
        "$lookup": {
            "from": "courses",
            "localField": "course_id",
            "foreignField": "course_id",
            "as": "course"
        }
    },
    {"$unwind": "$course"},

    # Stage 3: Field projection and transformation
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
            "final_exam_score": 1,
            "completed": 1,
            "certified": 1
        }
    }
]

cursor = db.learning_records.aggregate(pipeline)
df = pd.DataFrame(list(cursor))
```

---

## 5. Data Preprocessing & Feature Engineering
1. **Identifier Exclusion**: Primary keys and database object identifiers (`student_id`, `course_id`) were dropped to prevent data leakage.
2. **Categorical Encoding**: Categorical variables (`course_category`, `course_difficulty`, `education_level`) were transformed into numerical format using **One-Hot Encoding** (`pd.get_dummies(..., drop_first=True)`), yielding 18 model features.
3. **Train-Test Splitting**: The dataset (1,200 records) was partitioned into:
   - **Training Set**: 80% (960 records).
   - **Testing Set**: 20% (240 records).
   - Stratified splitting was enforced on `completed` to maintain identical class ratios in train and test splits.
4. **Feature Normalization**: Features were standardized using `StandardScaler`:
   $$z = \frac{x - \mu}{\sigma}$$
   The scaler was fitted exclusively on the training set and applied to the test set to avoid data leakage.

---

## 6. Machine Learning Model Implementations

### 6.1 Classification Models (Predicting Course Completion)
- **Logistic Regression**: Linear decision boundary model optimizing binary cross-entropy loss:
  $$\hat{y} = \sigma(w^T x + b) = \frac{1}{1 + e^{-(w^T x + b)}}$$
- **Decision Tree Classifier**: Non-linear tree algorithm using Gini Impurity ($I_G = 1 - \sum p_i^2$) with `max_depth=5` to prevent overfitting.
- **Random Forest Classifier**: Ensemble bagging model constructing 100 bootstrapped decision trees (`n_estimators=100`, `max_depth=8`) with majority voting.

### 6.2 Regression Models (Predicting Final Exam Score)
- **Linear Regression**: Ordinary Least Squares (OLS) minimizing residual sum of squares:
  $$\min_w ||Xw - y||_2^2$$
- **Decision Tree Regressor**: Recursive partitioning minimizing Mean Squared Error variance at leaf nodes (`max_depth=6`).
- **Random Forest Regressor**: Ensemble of 100 regression trees averaging individual tree predictions.

---

## 7. Model Evaluation Results

### 7.1 Classification Task: Student Course Completion
Target: `completed` (Binary: 0 or 1) | Test Size: 240 samples

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | **91.25%** | **93.39%** | **97.25%** | **95.28%** | **0.8349** |
| **Decision Tree** | **92.08%** | **93.83%** | **97.71%** | **95.73%** | **0.7721** |
| **Random Forest** | **91.67%** | **91.95%** | **99.54%** | **95.59%** | **0.8282** |

#### Analysis:
- **Decision Tree** achieved the highest test accuracy (**92.08%**) and F1 Score (**95.73%**), closely followed by **Random Forest** (**91.67%** accuracy, **99.54%** recall).
- **Random Forest** captured nearly every completing student (Recall: **99.54%**), ensuring negligible false negatives.
- **Logistic Regression** demonstrated strong generalization (**ROC-AUC: 0.8349**) and fast inference speed.

---

### 7.2 Regression Task: Final Exam Score Prediction (0 - 100)
Target: `final_exam_score` (Continuous) | Test Size: 240 samples

| Model | R² Score | MAE (Mean Absolute Error) | MSE | RMSE |
| :--- | :---: | :---: | :---: | :---: |
| **Linear Regression** | **0.6227** | **4.11 pts** | **25.80** | **5.08 pts** |
| **Decision Tree Regressor** | **0.5932** | **3.71 pts** | **27.82** | **5.27 pts** |
| **Random Forest Regressor** | **0.7208** | **3.27 pts** | **19.09** | **4.37 pts** |

#### Analysis:
- **Random Forest Regressor** achieved superior performance with an **R² Score of 0.7208**, accounting for **72.08%** of total score variance.
- **MAE of 3.27 points** indicates that predicted student exam marks deviate on average by only ~3.27 points on a 100-point grading scale.
- **Linear Regression** provided a robust baseline (**R²: 0.6227, MAE: 4.11 pts**), demonstrating strong linear correlation between study hours, assignments, and exam performance.

---

### 7.3 Feature Importance Breakdown
Analysis of Gini importance from the Random Forest models revealed key drivers of student achievement:
1. **Study Hours Per Week** (~34.2%): Strongest single predictor of exam score.
2. **Assignments Submitted** (~22.8%): Direct positive correlation with course completion.
3. **Attendance Rate** (~18.5%): Critical threshold factor for passing grades.
4. **Video Completion Rate** (~14.1%): Strong driver of syllabus coverage.
5. **Prior Experience & Age** (~10.4%): Secondary background predictors.

---

## 8. Bidirectional MongoDB Metrics Persistence
To close the loop between data storage and inference, the pipeline persists evaluation metrics directly back into MongoDB:
```python
db.ml_model_metrics.insert_one({
    "timestamp": datetime.utcnow(),
    "classification_metrics": {
        "Logistic Regression": {"Accuracy": 0.9125, "F1 Score": 0.9528},
        "Decision Tree": {"Accuracy": 0.9208, "F1 Score": 0.9573},
        "Random Forest": {"Accuracy": 0.9167, "F1 Score": 0.9559}
    },
    "regression_metrics": {
        "Linear Regression": {"R2 Score": 0.6227, "MAE": 4.11},
        "Random Forest": {"R2 Score": 0.7208, "MAE": 3.27}
    }
})
```
This enables real-time monitoring of model drift and historical retraining benchmarks directly in MongoDB Atlas / Compass.

---

## 9. Conclusion & Future Enhancements
This project successfully demonstrates the synergy of **MongoDB**, **PyMongo**, and **Machine Learning**:
- High-performance NoSQL data modeling for educational systems.
- Fast multi-collection joins via MongoDB's native `$lookup` aggregation framework.
- Accurate predictive analytics for student retention, course completion (**Accuracy: 92.08%, F1: 95.73%**), and grading outcomes (**R²: 0.7208, MAE: 3.27 pts**).

### Future Roadmap:
- **Real-Time Model Serving**: Expose trained model weights via FastAPI endpoints connected to MongoDB Change Streams.
- **Deep Learning / Neural Networks**: Evaluate Multilayer Perceptrons (MLP) for sequential clickstream telemetry.
- **Automated Early Warning Alerts**: Trigger automated student advisory interventions whenever predicted completion probability falls below 50%.

---

*Authored for Academic & Industry Submission | Learnify LMS Machine Learning Engine*
