from pydantic import BaseModel
from datetime import date

class TransacaoBase(BaseModel):
    tipo: str
    valor: float
    data: date
    descricao: str
    categoria: str

class TransacaoCreate(TransacaoBase):
    pass

class TransacaoOut(TransacaoBase):
    id: int

    class Config:
        from_attributes = True