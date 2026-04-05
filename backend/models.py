from sqlalchemy import Column, Integer, String, Float, Date
from .database import Base

class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String, index=True) # Será "receita" ou "despesa"
    valor = Column(Float)
    data = Column(Date)
    descricao = Column(String)
    categoria = Column(String) # Ex: "Luz", "Gás", "Salário", "Investimento"