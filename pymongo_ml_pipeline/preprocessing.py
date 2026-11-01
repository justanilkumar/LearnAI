"""
Data Preprocessing Module
Performs data cleaning, categorical encoding, train-test splitting, and feature scaling.
"""
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

def preprocess_data(df, test_size=0.2, random_state=42):
    print("⚙️ Preprocessing dataset: cleaning, encoding categorical variables, and scaling...")

    data = df.copy()

    # Drop non-predictive identifier columns
    cols_to_drop = ["student_id", "course_id"]
    data = data.drop(columns=[col for col in cols_to_drop if col in data.columns])

    # Separate features and targets
    y_reg = data["final_exam_score"]
    y_class = data["completed"]

    # Drop targets from feature matrix
    X_raw = data.drop(columns=["final_exam_score", "completed", "certified"], errors="ignore")

    # One-Hot Encoding for categorical features
    categorical_cols = ["course_category", "course_difficulty", "education_level"]
    X_encoded = pd.get_dummies(X_raw, columns=[col for col in categorical_cols if col in X_raw.columns], drop_first=True)

    feature_names = list(X_encoded.columns)

    # Train / Test Split
    X_train, X_test, y_class_train, y_class_test, y_reg_train, y_reg_test = train_test_split(
        X_encoded, y_class, y_reg, test_size=test_size, random_state=random_state, stratify=y_class
    )

    # Feature Scaling (StandardScaler)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Also keep DataFrame versions for tree models
    X_train_scaled_df = pd.DataFrame(X_train_scaled, columns=feature_names, index=X_train.index)
    X_test_scaled_df = pd.DataFrame(X_test_scaled, columns=feature_names, index=X_test.index)

    print(f"✅ Preprocessing Complete: Train shape: {X_train.shape}, Test shape: {X_test.shape}")
    print(f"📋 Encoded Features ({len(feature_names)}): {feature_names}")

    return {
        "X_train_raw": X_train,
        "X_test_raw": X_test,
        "X_train_scaled": X_train_scaled_df,
        "X_test_scaled": X_test_scaled_df,
        "y_class_train": y_class_train,
        "y_class_test": y_class_test,
        "y_reg_train": y_reg_train,
        "y_reg_test": y_reg_test,
        "scaler": scaler,
        "feature_names": feature_names
    }
