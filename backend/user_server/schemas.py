from pydantic import BaseModel

class UserSchema(BaseModel):
    username:str
    password:str
    email:str

class UserResponse(BaseModel):
    id:int
    email:str
    username: str

class UserLogin(BaseModel):
    email:str
    password:str

    