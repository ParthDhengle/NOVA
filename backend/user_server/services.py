from .schemas import UserSchema,UserLogin,UserResponse
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import BackgroundTasks,HTTPException,status,Request
from .models import UserModel
from pwdlib import PasswordHash
# from utils.mail import simple_send
from datetime import datetime,timedelta,timezone
from utils.config import settings
import jwt
from sqlalchemy import select


password_hash=PasswordHash.recommended()

def get_password_hash(password):
    return password_hash.hash(password)

def verify_password(plain_password,hashed_password):
    return password_hash.verify(plain_password,hashed_password)

async def register(body:UserSchema,bg_task:BackgroundTasks,db:AsyncSession):
    print(body)
    is_user=await db.execute(select(UserModel).where(UserModel.user_name==body.username))
    user=is_user.scalar_one_or_none()
    if user:
        raise HTTPException(400,"User name already exist")

    is_email=await db.execute(select(UserModel).where(UserModel.email==body.email))
    email=is_email.scalar_one_or_none()
    if email:
        raise HTTPException(400,"email already exist")

    hash_password=get_password_hash(body.password)

    new_user=UserModel(
        user_name=body.username,
        password_hash=hash_password,
        email=body.email
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # bg_task.add_task(simple_send,[new_user.email])

    return UserResponse(
        id=new_user.user_id,
        email=new_user.email,
        username=new_user.user_name,
    )

async def login_user(body:UserLogin,db:AsyncSession,):
    is_email=await db.execute(select(UserModel).where(UserModel.email==body.email))
    user=is_email.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User Not found")

    if not verify_password(body.password,user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Password didnt matched")

    exp_time=(datetime.now(timezone.utc)+timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()
    token=jwt.encode({"_id":user.user_id,"username":user.user_name,"exp":exp_time},settings.SECRET_KEY,settings.ALGORITHM)

    return {"token": token}


async def is_authenticated(request:Request,db:AsyncSession):
    try:
        authorization=request.headers.get("authorization")
        if not authorization:
            raise HTTPException(401,"Login required")

        scheme, _, token = authorization.partition(" ")
        
        if scheme.lower() != "bearer" or not token:
            raise HTTPException(status_code=401,detail="Invalid authorization header")
        
        data=jwt.decode(token,settings.SECRET_KEY,algorithms=[settings.ALGORITHM])
        user_id=data.get("_id")
        if not user_id:
            raise HTTPException(status_code=401,detail="Invalid token")

        result=await db.execute(select(UserModel).where(UserModel.user_id==user_id))
        user=result.scalar_one_or_none()
        if not user:
            raise HTTPException(401,"user not found")
        return UserResponse(
            id=user.user_id,
            email=user.email,
            username=user.user_name,
        )
    except Exception:
        raise HTTPException(401,"You are unauthorized")