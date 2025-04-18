from pydantic import BaseModel, EmailStr, ConfigDict

class StudentData(BaseModel):
    id: str

    first_name: str
    last_name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)