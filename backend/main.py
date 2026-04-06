from fastapi import FastAPI, Depends, HTTPException
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


# =========================================
# CRIAR NOVA TRANSAÇÃO
# =========================================
@app.post("/transacoes/", response_model=schemas.TransacaoOut)
def criar_transacao(transacao: schemas.TransacaoCreate, db: Session = Depends(database.get_db)):
    db_transacao = models.Transacao(**transacao.model_dump())
    db.add(db_transacao)
    db.commit()
    db.refresh(db_transacao)
    return db_transacao


# =========================================
# LER E FILTRAR TRANSAÇÕES
# =========================================
@app.get("/transacoes/", response_model=List[schemas.TransacaoOut])
def ler_transacoes(ano: int = None, mes: int = None, db: Session = Depends(database.get_db)):
    # 1. Puxa TODAS as transações do banco de dados primeiro
    todas_transacoes = db.query(models.Transacao).all()
    
    # 2. Se o frontend enviou ano e mês, o Python faz o filtro na mão
    if ano and mes:
        mes_formatado = f"{mes:02d}" # Garante que 4 vire "04"
        prefixo = f"{ano}-{mes_formatado}-"
        
        # Filtra a lista verificando se o texto da data começa com o prefixo
        transacoes_filtradas = []
        for t in todas_transacoes:
            # Transformamos em string (str) para evitar conflitos de tipo de dado
            if str(t.data).startswith(prefixo):
                transacoes_filtradas.append(t)
                
        return transacoes_filtradas
        
    # Se não mandou filtro, retorna tudo
    return todas_transacoes


# =========================================
# OBTER RESUMO DO MÊS (DIAS ÚTEIS)
# =========================================
@app.get("/resumo/{ano}/{mes}")
def obter_resumo_mes(ano: int, mes: int):
    # Por enquanto, retorna apenas os dados de tempo. 
    dias_uteis, feriados = utils.calcular_dias_uteis(ano, mes)
    return {
        "ano": ano,
        "mes": mes,
        "dias_uteis_totais": dias_uteis,
        "feriados": feriados
    }


# =========================================
# ATUALIZAR TRANSAÇÃO EXISTENTE
# =========================================
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


# =========================================
# DELETAR TRANSAÇÃO
# =========================================
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