from utils.database import Base
from sqlalchemy import Column,Integer,String,ForeignKey,Enum,Text,DateTime,JSON,PrimaryKeyConstraint
from datetime import datetime
 
#usermemory is handled by Long term memory node in graph..automatically

class ConversationModel(Base):
    __tablename__="conversations"

    convo_id=Column(Integer,primary_key=True)
    user_id=Column(Integer,nullable=False,index=True)
    title=Column(String(200),default="New chat",nullable=False,)
    project_id=Column(Integer,nullable=True,index=True)
    created_at=Column(DateTime,default=datetime.now,nullable=False)
    updated_at=Column(DateTime,default=datetime.now,onupdate=datetime.now, nullable=False)
    deleted_at=Column(DateTime,default=None,nullable=True)

class MessageModel(Base):
    __tablename__="messages"

    message_id=Column(Integer,primary_key=True)
    convo_id=Column(Integer,ForeignKey("conversations.convo_id",ondelete="CASCADE"),nullable=False,index=True)
    role=Column(Enum("user",'assistant','system','tool',name="message_role"),nullable=False,)
    content=Column(Text,nullable=True)
    created_at=Column(DateTime,default=datetime.now,nullable=False)
    updated_at=Column(DateTime,default=datetime.now,onupdate=datetime.now, nullable=False)
    deleted_at=Column(DateTime,default=None,nullable=True)

class AgentRunModel(Base):
    __tablename__="agent_runs"

    run_id=Column(Integer,primary_key=True)
    convo_id=Column(Integer,ForeignKey("conversation_table.convo_id",ondelete="CASCADE"),nullable=False,index=True)
    status=Column(Enum("Queued","running","waiting_approval","completed",'failed','cancelled',name="agent_status"),nullable=False,default="queued")
    started_at=Column(DateTime,nullable=True,)
    completed_at=Column(DateTime,nullable=True,)
#is their any way of langgraph automatically storing this agent run and agent events using that invoke as used in langsmith? so i dont have to create the table for them?

class AgentEventModel(Base):
    __tablename__ = "agent_events"

    event_id = Column(Integer,primary_key=True,)
    run_id = Column(Integer,ForeignKey("agent_runs.run_id",ondelete="CASCADE",),nullable=False,index=True,)
    event_type = Column(String(50),nullable=False,index=True,)
    payload = Column(JSON,nullable=True,)
    created_at = Column(DateTime,default=datetime.now,nullable=False,)

class FileModel(Base):
    __tablename__="files"

    file_id=Column(Integer,primary_key=True)
    user_id=Column(Integer,nullable=False,index=True)
    filename=Column(String(255),nullable=False)
    content_type=Column(String(500),nullable=False)
    storage_key=Column(Text,nullable=False)
    size_bytes=Column(Integer,nullable=False)
    created_at=Column(DateTime,default=datetime.now,nullable=False)
    deleted_at=Column(DateTime,default=None,nullable=True)
    
class MessageFileModel(Base):
    __tablename__="message_files"
    message_id=Column(Integer,ForeignKey("messages.message_id",ondelete="CASCADE"),nullable=False)
    file_id=Column(Integer,ForeignKey("files.file_id" , ondelete="CASCADE"),nullable=False)
    created_at=Column(DateTime,default=datetime.now,nullable=False)
    __table_args__ = (
        PrimaryKeyConstraint(
            "message_id",
            "file_id",
        ),
    )
class ProjectModel(Base):
    project_id=Column(Integer,primary_key=True)
    user_id=Column(Integer,nullable=False)
    title=Column(String(200),nullable=False)
    description=Column(Text,nullable=True)
    created_at=Column(DateTime,default=datetime.now,nullable=False)
    updated_at=Column(DateTime,default=datetime.now,onupdate=datetime.now, nullable=False)
    deleted_at=Column(DateTime,default=None,nullable=True)

# class ProjecMemory -> handled by ltm by langgrph automatically

