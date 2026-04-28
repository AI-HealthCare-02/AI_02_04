from fastapi import APIRouter, Depends, HTTPException,Header, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services import predict as predict_services
from app.core.limiter import limiter

router = APIRouter()


@router.post("")
@limiter.limit("10/minute")
def predict(
    request:Request,
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()

    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")

    try:
        result = predict_services.predict_diabetes_risk(user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "data": result}


@router.get("/history")
def get_predict_history(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    from app.models.health import DiabetesPrediction

    predictions = (
        db.query(DiabetesPrediction)
        .filter(DiabetesPrediction.user_id == current_user["user_id"])
        .order_by(DiabetesPrediction.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "success": True,
        "data": [
            {
                "predict_id": p.id,
                "risk_level": p.risk_level,
                "risk_score": p.risk_score,
                "top_factors": p.top_factors,
                "created_at": p.created_at,
            }
            for p in predictions
        ],
    }



@router.post('/batch')
def predict_batch(
        x_internal_key: str = Header(..., alias="X-Internal-Key"),
        db: Session = Depends(get_db)
):
    if x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code =403, detail="권한 없음")
    
    users = db.query(User).all()

    results = []

    for user in users:
        try:
            result = predict_services.predict_diabetes_risk(user)
            prediction = DiabetesPrediction(
                user_id = user.id,
                risk_score =result["risk_score"],
                risk_level =result["risk_level"] 
            )
            db.add(prediction)

            results.append({"user_id": user.id, "status": "success"})
        except Exception as e:
            results.append({"user_id": user.id, "status": "failed", "error": str(e)})
        
    db.commit()

    return {
            "success":True,
            "data"  : results
        }
