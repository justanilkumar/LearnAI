"""
Regression Models Module
Implements Linear Regression, Decision Tree Regressor, and Random Forest Regressor.
Evaluates: R² Score, MAE (Mean Absolute Error), MSE, and RMSE.
"""
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

def train_and_evaluate_regression(data):
    print("\n🎯 Training Regression Models: Predicting Student Final Exam Scores...")

    X_train = data["X_train_scaled"]
    X_test = data["X_test_scaled"]
    y_train = data["y_reg_train"]
    y_test = data["y_reg_test"]

    models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=6, min_samples_split=8, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=8, min_samples_split=4, random_state=42)
    }

    results = {}
    trained_models = {}

    for name, model in models.items():
        print(f"  ⚡ Training {name}...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)

        results[name] = {
            "R2 Score": round(r2, 4),
            "MAE": round(mae, 4),
            "MSE": round(mse, 4),
            "RMSE": round(rmse, 4),
            "y_pred": y_pred.tolist()
        }
        trained_models[name] = model

    print("✅ Regression Model Training & Evaluation Complete.")
    return results, trained_models
