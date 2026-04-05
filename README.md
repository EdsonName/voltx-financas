# VoltX - Gestão Financeira Dinâmica ⚡

A **VoltX** é uma aplicação de controle financeiro pessoal desenvolvida para facilitar a gestão de receitas e despesas com uma interface visual intuitiva. O sistema calcula automaticamente dias úteis e feriados, permitindo uma projeção real de ganhos e gastos ao longo do ano.

---

## 🚀 Funcionalidades (v0.0.1)

- **Cálculo Automático de Dias Úteis:** Integração com a biblioteca `holidays` para identificar feriados nacionais e calcular dias úteis restantes no mês.
- **Dashboard Interativo:** Visualização de balanço mensal (Receitas vs Despesas) via Gráfico de Pizza.
- **Evolução de Lançamentos:** Gráfico de barras que mostra a distribuição financeira ao longo do tempo.
- **Persistência de Dados:** Uso de SQLite para armazenamento local e seguro das transações.
- **API Moderna:** Backend construído com FastAPI para alta performance e documentação automática (Swagger).

## 🛠️ Tecnologias Utilizadas

- **Linguagem:** [Python](https://www.python.org/)
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/)
- **Banco de Dados:** [SQLite](https://www.sqlite.org/) (com SQLAlchemy)
- **Frontend:** HTML5, CSS3 e JavaScript (ES6+)
- **Gráficos:** [Chart.js](https://www.chartjs.org/)
- **Versionamento:** [Git](https://git-scm.com/) seguindo [Boas Práticas de Commit](https://github.com/sampaiodias/git-boas-praticas)

## 📂 Estrutura do Projeto

```text
financas_app/
├── backend/        # API, Modelos de Dados e Regras de Negócio
├── frontend/       # Interface do Usuário (HTML, CSS, JS)
├── data/           # Banco de Dados Local (SQLite)
└── requirements.txt # Dependências do Projeto