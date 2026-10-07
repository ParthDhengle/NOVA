from utils.database import Base
from sqlalchemy import Column, Integer, Float,String,Boolean,ForeignKey,DateTime,Text,Enum,PrimaryKeyConstraint
from datetime import datetime

class UserModel(Base):
    __tablename__="user_table"

    user_id=Column(Integer,primary_key=True)
    user_name=Column(String,nullable=False,unique=True)
    email=Column(String,nullable=False,unique=True)
    password_hash=Column(String,nullable=False)
    plan=Column(Enum("free","plus","pro","ultra",name="plans"),nullable=True,default="free")
    address=Column(String,nullable=True)
    created_at=Column(DateTime,default=datetime.now,nullable=False)
    updated_at=Column(DateTime,default=datetime.now,onupdate=datetime.now, nullable=False)
    deleted_at=Column(DateTime,default=None,nullable=True)

class PersonalizationModel(Base):
    __tablename__ = "personalization"

    user_id = Column(Integer,primary_key=True)
    instructions = Column(Text, nullable=True)
    tone = Column(Enum("default","professional","friendly",name="user_tone",),nullable=False,default="default",)
    created_at = Column(DateTime,default=datetime.now,nullable=False,)
    updated_at = Column(DateTime,default=datetime.now,onupdate=datetime.now,nullable=False,)

class AuthSessionModel(Base):
    __tablename__="auth_sessions"

    session_id=Column(Integer,primary_key=True)
    user_id=Column(Integer,ForeignKey("user_table.user_id" , ondelete="CASCADE"),nullable=False,index=True,)
    refresh_token_hash=Column(Text,nullable=False)
    expires_at=Column(DateTime,nullable=False)
    created_at=Column(DateTime,default=datetime.now,nullable=False)
    revoked_at=Column(DateTime,default=None,nullable=True)

class UsageModel(Base):
    __tablename__="usage_counter"
    user_id=Column(Integer,nullable=False)
    period_start=Column(DateTime,nullable=False)
    requests=Column(Integer,default=0, nullable=False)
    tokens=Column(Integer,nullable=False,default=0)
    updated_at=Column(DateTime,default=datetime.now,onupdate=datetime.now,nullable=False)
    __table_args__ = (
        PrimaryKeyConstraint(
            "user_id",
            "period_start",
        ),
    )
class SettingModel(Base):
    __tablename__="settings"

    user_id=Column(Integer,primary_key=True)
    theme=Column(String)
    created_at=Column(DateTime,default=datetime.now,nullable=False)
    updated_at=Column(DateTime,default=datetime.now,onupdate=datetime.now, nullable=False)

