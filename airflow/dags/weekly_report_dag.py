from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
import os
import requests

default_args = {"owner": "dangmago", "retries": 3, "retry_delay": timedelta(seconds=30)}


def get_all_users():
    engine = create_engine(os.environ.get("DANGMAGO_DB_URL"))

    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT id, age, gender, bmi, exercise_freq, smoke_status, alcohol_status, is_hypertension FROM users"
            )
        )

        users = result.fetchall()

    return [dict(row._mapping) for row in users]


def repredict_users(**context):
    users = context["ti"].xcom_pull(task_ids="get_all_users")
    print(f"재예측 대상 유저 수: {len(users)}")
    response = requests.post(
        f"{os.environ.get('BACKEND_URL')}/predict/batch",
        headers={"X-Internal-Key": os.environ.get("INTERNAL_API_KEY")},
    )
    if response.status_code != 200:
        raise Exception(f"배치 예측 실패: {response.text}")

    return response.json()


def generate_weekly_report(**context):
    response = requests.post(
        f"{os.environ.get('BACKEND_URL')}/report/weekly/batch",
        headers={"X-Internal-Key": os.environ.get("INTERNAL_API_KEY")},
    )
    if response.status_code != 200:
        raise Exception(f"주가 리포트 생성 실패: {response.text}")

    return response.json()


with DAG(
    dag_id="dangmago",
    default_args=default_args,
    schedule_interval="0 4 * * 7",
    start_date=datetime(2026, 4, 20),
    catchup=False,
) as dag:

    task1 = PythonOperator(task_id="get_all_users", python_callable=get_all_users)

    task2 = PythonOperator(task_id="repredict_users", python_callable=repredict_users)

    task3 = PythonOperator(
        task_id="generate_weekly_report", python_callable=generate_weekly_report
    )

    task1 >> task2 >> task3

    # docker compose exec airflow-webserver airflow users create --username admin --password admin --firstname Admin --lastname User --role Admin --email admin@example.com
