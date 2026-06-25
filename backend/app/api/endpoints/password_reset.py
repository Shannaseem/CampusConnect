from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.config import settings
from app.core.email_service import send_email
from app.core.security import create_password_reset_token, verify_password_reset_token
from app.crud.user import get_user_by_email, update_user_password
from app.db.database import get_db
from app.schemas.user import PasswordResetRequest, PasswordReset

router = APIRouter()

@router.post('/request-reset')
def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, request.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    token = create_password_reset_token(user.email)
    reset_link = f"{settings.FRONTEND_URL}/reset.html?reset_token={token}"
    body = (
        f"Hello {user.name},\n\n"
        "We received a request to reset your password. Click the link below to set a new password:\n\n"
        f"{reset_link}\n\n"
        "If you did not request this, please ignore this email.\n\n"
        "Thanks,\nCampusConnect Team"
    )
    send_email(user.email, 'CampusConnect Password Reset', body)
    return {'message': 'Password reset email sent (check console if SMTP not configured).'}

@router.post('/reset')
def reset_password(request: PasswordReset, db: Session = Depends(get_db)):
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid or expired reset token')

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    update_user_password(db=db, user=user, new_password=request.new_password)
    return {'message': 'Password has been reset successfully.'}
