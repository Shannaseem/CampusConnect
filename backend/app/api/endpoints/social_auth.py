from urllib.parse import urlencode
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from authlib.integrations.starlette_client import OAuth, OAuthError

from app.db.database import get_db
from app.schemas.user import SocialLoginRequest, Token
from app.crud.user import get_user_by_email, create_social_user
from app.core.security import create_access_token
from app.core.config import settings

router = APIRouter()

oauth = OAuth()

logger = logging.getLogger(__name__)

def ensure_oauth_config(provider_name: str, client_id: str, client_secret: str):
    if not client_id or not client_secret:
        raise RuntimeError(
            f"Missing OAuth config for {provider_name}. "
            "Set {provider_name.upper()}_CLIENT_ID and {provider_name.upper()}_CLIENT_SECRET in .env."
        )

ensure_oauth_config('google', settings.GOOGLE_CLIENT_ID, settings.GOOGLE_CLIENT_SECRET)
ensure_oauth_config('github', settings.GITHUB_CLIENT_ID, settings.GITHUB_CLIENT_SECRET)

oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

oauth.register(
    name='github',
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
    authorize_url='https://github.com/login/oauth/authorize',
    access_token_url='https://github.com/login/oauth/access_token',
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

@router.get('/oauth/login/{provider}')
async def oauth_login(provider: str, request: Request):
    provider = provider.lower()
    if provider not in ['google', 'github']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported provider')

    redirect_uri = request.url_for('oauth_callback', provider=provider)
    try:
        return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)
    except OAuthError as error:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(error))

@router.get('/oauth/callback/{provider}', name='oauth_callback')
async def oauth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    provider = provider.lower()
    if provider not in ['google', 'github']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported provider')

    client = oauth.create_client(provider)
    try:
        token = await client.authorize_access_token(request)
    except OAuthError as error:
        logger.exception('OAuth authorize_access_token failed for provider %s', provider)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='OAuth callback failed: ' + str(error))
    except Exception as exc:
        logger.exception('Unexpected error during token exchange for provider %s', provider)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Internal OAuth error')

    name = None
    email = None

    if provider == 'google':
        try:
            user_info = await client.parse_id_token(request, token)
            name = user_info.get('name')
            email = user_info.get('email')
        except Exception:
            logger.exception('Failed to parse id token for google')
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Failed to parse Google id token')
    elif provider == 'github':
        try:
            user_info = await client.get('user')
            profile = user_info.json()
            name = profile.get('name') or profile.get('login')
            email = profile.get('email')
            if not email:
                emails_resp = await client.get('user/emails')
                emails = emails_resp.json()
                primary = next((item for item in emails if item.get('primary') and item.get('verified')), None)
                email = primary.get('email') if primary else None
        except OAuthError as e:
            logger.exception('OAuthError when fetching GitHub profile or emails')
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail='Failed to fetch GitHub profile')
        except Exception:
            logger.exception('Unexpected error when fetching GitHub profile or emails')
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail='Failed to process GitHub response')

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unable to obtain email from provider')

    user = get_user_by_email(db, email=email)
    if not user:
        user = create_social_user(db=db, email=email, name=name or email)

    if not user.is_approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Your account is pending admin approval.')

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )

    redirect_url = f"{settings.FRONTEND_URL}/index.html?social_token={access_token}"
    return RedirectResponse(url=redirect_url)

@router.post('/social', response_model=Token)
def social_login(request: SocialLoginRequest, db: Session = Depends(get_db)):
    provider = request.provider.lower()
    if provider not in ['google', 'github']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Unsupported provider')

    user = get_user_by_email(db, email=request.email)
    if not user:
        user = create_social_user(db=db, email=request.email, name=request.name)

    if not user.is_approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Your account is pending admin approval.')

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
