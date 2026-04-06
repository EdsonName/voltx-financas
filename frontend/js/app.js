const API_URL = 'http://127.0.0.1:8000';
let transacoesDoMes = [];

let mesSelecionado = new Date().getMonth() + 1;
let anoSelecionado = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('select-mes').value = mesSelecionado;
    document.getElementById('select-ano').value = anoSelecionado;

    document.getElementById('btn-filtrar').addEventListener('click', async () => {
        mesSelecionado = parseInt(document.getElementById('select-mes').value);
        anoSelecionado = parseInt(document.getElementById('select-ano').value);
        await carregarDadosIniciais(); 
        mostrarToast(`Exibindo dados de ${mesSelecionado}/${anoSelecionado}`, 'success');
    });

    configurarCabecalhoDatas();
    await carregarDadosIniciais();
});

function configurarCabecalhoDatas() {
    const hoje = new Date();
    document.getElementById('data-atual').innerText = hoje.toLocaleDateString('pt-BR');
}

function renderizarTabela(transacoes) {
    const tbody = document.getElementById('corpo-tabela');
    tbody.innerHTML = ''; 

    transacoes.forEach(t => {
        const tr = document.createElement('tr');
        const dataFormatada = t.data.split('-').reverse().join('/');
        const valorFormatado = t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const classeCor = t.tipo === 'receita' ? 'receita-text' : 'despesa-text';
        const simbolo = t.tipo === 'receita' ? '+' : '-';

        tr.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${t.descricao}</td>
            <td>${t.categoria}</td>
            <td class="${classeCor}">${t.tipo.toUpperCase()}</td>
            <td class="${classeCor}">${simbolo} ${valorFormatado}</td>
            <td>
                <button class="btn-acao btn-editar" onclick="prepararEdicao(${t.id})">Editar</button>
                <button class="btn-acao btn-excluir" onclick="deletarTransacao(${t.id})">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function carregarDadosIniciais() {
    try {
        const resResumo = await fetch(`${API_URL}/resumo/${anoSelecionado}/${mesSelecionado}`);
        if(resResumo.ok) {
            const resumo = await resResumo.json();
            document.getElementById('dias-uteis-totais').innerText = resumo.dias_uteis_totais;
            document.getElementById('feriados-mes').innerText = resumo.feriados;
            
            const hoje = new Date();
            if (mesSelecionado === (hoje.getMonth() + 1) && anoSelecionado === hoje.getFullYear()) {
                let diasPassados = hoje.getDate();
                let uteisPassados = Math.floor(diasPassados * (resumo.dias_uteis_totais / 30)); 
                document.getElementById('dias-restantes').innerText = resumo.dias_uteis_totais - uteisPassados;
            } else if (anoSelecionado > hoje.getFullYear() || (anoSelecionado === hoje.getFullYear() && mesSelecionado > hoje.getMonth() + 1)) {
                document.getElementById('dias-restantes').innerText = resumo.dias_uteis_totais;
            } else {
                document.getElementById('dias-restantes').innerText = "0";
            }
        }

        const resTransacoes = await fetch(`${API_URL}/transacoes/?ano=${anoSelecionado}&mes=${mesSelecionado}`);
        if(resTransacoes.ok) {
            transacoesDoMes = await resTransacoes.json();
            
            // --- MATEMÁTICA DO SALDO BLINDADA ---
            let receitas = 0;
            let despesas = 0;
            transacoesDoMes.forEach(t => {
                if (t.tipo === 'receita') receitas += t.valor;
                else despesas += t.valor;
            });
            
            const saldo = receitas - despesas;
            const saldoEl = document.getElementById('saldo-liquido');
            
            if (saldoEl) {
                saldoEl.innerText = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                saldoEl.classList.remove('positivo', 'negativo');
                if (saldo >= 0) {
                    saldoEl.classList.add('positivo');
                } else {
                    saldoEl.classList.add('negativo');
                }
            }

            // Garante que a função de gráficos só é chamada se existir
            if (typeof atualizarGraficos === "function") {
                atualizarGraficos(transacoesDoMes);
            }
            renderizarTabela(transacoesDoMes);
        }
    } catch (error) {
        console.error("Erro no carregamento.", error);
    }
}

function prepararEdicao(id) {
    const transacao = transacoesDoMes.find(t => t.id === id);
    if(transacao) {
        document.getElementById('tipo').value = transacao.tipo;
        document.getElementById('descricao').value = transacao.descricao;
        document.getElementById('valor').value = transacao.valor;
        document.getElementById('data').value = transacao.data;
        document.getElementById('categoria').value = transacao.categoria;
        
        document.getElementById('transacao-id-editando').value = id;
        document.querySelector('#form-transacao button').innerText = 'Atualizar Lançamento';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function deletarTransacao(id) {
    if(confirm("Tem certeza que deseja excluir?")) {
        try {
            const resposta = await fetch(`${API_URL}/transacoes/${id}`, { method: 'DELETE' });
            if(resposta.ok) {
                mostrarToast("Lançamento excluído com sucesso!", "success");
                await carregarDadosIniciais(); 
            }
        } catch(error) {}
    }
}

document.getElementById('form-transacao').addEventListener('submit', async (e) => {
    e.preventDefault();

    const dados = {
        tipo: document.getElementById('tipo').value,
        descricao: document.getElementById('descricao').value,
        valor: parseFloat(document.getElementById('valor').value),
        data: document.getElementById('data').value,
        categoria: document.getElementById('categoria').value
    };

    const idEditando = document.getElementById('transacao-id-editando').value;
    let url = `${API_URL}/transacoes/`;
    let metodo = 'POST'; 

    if(idEditando !== "") {
        url = `${API_URL}/transacoes/${idEditando}`;
        metodo = 'PUT';
    }

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if(resposta.ok) {
            document.getElementById('form-transacao').reset();
            document.getElementById('transacao-id-editando').value = ""; 
            document.querySelector('#form-transacao button').innerText = 'Salvar Lançamento'; 
            mostrarToast('Salvo com sucesso!', 'success');
            await carregarDadosIniciais(); 
        }
    } catch (error) {}
});

function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return; 
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerText = mensagem;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, 8000); 
}