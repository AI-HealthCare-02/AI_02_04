from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.services import predict as predict_services
router = APIRouter()


@router.post('')
def predict(
  current_user:dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  user = db.query(User).filter(User.id == current_user["user_id"]).first()

  if not user:
    raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")
  
  try :
    result = predict_services.predict_diabetes_risk(user)
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
  

  return {
        "success": True,
        "data":result
    }


@router.get('/history')
def get_predict_history(
  current_user: dict = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  from app.models.health import DiabetesPrediction
  predictions = db.query(DiabetesPrediction).filter(
    DiabetesPrediction.user_id == current_user["user_id"]
  ).order_by(DiabetesPrediction.created_at.desc()).limit(10).all()

  return {
    "success" : True,
    "data":[
     {
         "predict_id":  p.id,
         "risk_level":  p.risk_level,
         "risk_score":  p.risk_score,
         "top_factors": p.top_factors,
         "created_at":  p.created_at,
     }
            for p in predictions
    ]
  }