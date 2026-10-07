from fastapi import APIRouter,status,Request,BackgroundTasks,Depends
from .schemas import UserSchema,UserLogin,UserResponse
from sqlalchemy.ext.asyncio import AsyncSession
from utils.database import get_db
from user_server import services

user_router=APIRouter(prefix="/api/auth")

@user_router.post("/register",response_model=UserResponse)
async def register_route(body:UserSchema,bg_task:BackgroundTasks,db:AsyncSession=Depends(get_db)):
    return await services.register(body,bg_task,db)

@user_router.post("/login")
async def login_route(body:UserLogin,db:AsyncSession=Depends(get_db)):
    return await services.login_user(body,db)

@user_router.get("/is_auth",response_model=UserResponse)
async def is_auth_route(request:Request,db:AsyncSession=Depends(get_db)):
    return await services.is_authenticated(request,db)


@user_router.post("/logout")
async def logout_route():
    return {"message": "Logged out successfully"}