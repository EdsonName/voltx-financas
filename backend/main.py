
from fastapi import FastAPI, Depends, HTTPException
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, database, utils

# Cria o arquivo do banco de dados e as tabelas assim que o app iniciar
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="API Dash Finanças")

# Permite que o nosso frontend (HTML/JS) converse com este backend sem ser bloqueado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/transacoes/", response_model=schemas.TransacaoOut)
def criar_transacao(transacao: schemas.TransacaoCreate, db: Session = Depends(database.get_db)):
    db_transacao = models.Transacao(**transacao.model_dump())
    db.add(db_transacao)
    db.commit()
    db.refresh(db_transacao)
    return db_transacao

@app.get("/transacoes/", response_model=List[schemas.TransacaoOut])
def listar_transacoes(db: Session = Depends(database.get_db)):
    return db.query(models.Transacao).all()

@app.get("/resumo/{ano}/{mes}")
def obter_resumo_mes(ano: int, mes: int):
    # Por enquanto, retorna apenas os dados de tempo. 
    # Na próxima versão, faremos as somas de dinheiro aqui!
    dias_uteis, feriados = utils.calcular_dias_uteis(ano, mes)
    return {
        "ano": ano,
        "mes": mes,
        "dias_uteis_totais": dias_uteis,
        "feriados": feriados
    }

@app.put("/transacoes/{transacao_id}", response_model=schemas.TransacaoOut)
def atualizar_transacao(transacao_id: int, transacao: schemas.TransacaoCreate, db: Session = Depends(database.get_db)):
    # Busca a transação pelo ID no banco de dados
    db_transacao = db.query(models.Transacao).filter(models.Transacao.id == transacao_id).first()
    
    # Se não encontrar, retorna um erro 404
    if db_transacao is None:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # Atualiza os dados no banco
    for key, value in transacao.model_dump().items():
        setattr(db_transacao, key, value)
        
    db.commit()
    db.refresh(db_transacao)
    return db_transacao

@app.delete("/transacoes/{transacao_id}")
def deletar_transacao(transacao_id: int, db: Session = Depends(database.get_db)):
    # Busca a transação pelo ID
    db_transacao = db.query(models.Transacao).filter(models.Transacao.id == transacao_id).first()
    
    # Se não encontrar, retorna um erro 404
    if db_transacao is None:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    # Deleta do banco e salva a alteração
    db.delete(db_transacao)
    db.commit()
    return {"mensagem": "Transação deletada com sucesso"}