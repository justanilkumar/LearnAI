"""
Classification Models Module
Implements Logistic Regression, Decision Tree, and Random Forest Classifier.
Evaluates: Accuracy, Precision, Recall, F1 Score, and ROC-AUC.
"""
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

def train_and_evaluate_classification(data):
    print("\n🎯 Training Classification Models: Predicting Student Course Completion...")

    X_train = data["X_train_scaled"]
    X_test = data["X_test_scaled"]
    y_train = data["y_class_train"]
    y_test = data["y_class_test"]

    models = {
        "Logistic Regression": LogisticRegression(random_state=42, max_iter=1000),
        "Decision Tree": DecisionTreeClassifier(max_depth=5, min_samples_split=10, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=8, min_samples_split=5, random_state=42)
    }

    results = {}
    trained_models = {}

    for name, model in models.items():
        print(f"  ⚡ Training {name}...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test, y_prob) if y_prob is not None else 0.0
        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "Accuracy": round(acc, 4),
            "Precision": round(prec, 4),
            "Recall": round(rec, 4),
            "F1 Score": round(f1, 4),
            "ROC-AUC": round(roc_auc, 4),
            "Confusion Matrix": cm,
            "y_pred": y_pred.tolist(),
            "Classification Report": classification_report(y_test, y_pred, output_dict=True)
        }
        trained_models[name] = model

    print("✅ Classification Model Training & Evaluation Complete.")
    return results, trained_models
