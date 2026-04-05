const API_URL = 'http://127.0.0.1:8000';
let transacoesDoMes = [];

document.addEventListener('DOMContentLoaded', async () => {
    configurarCabecalhoDatas();
    await carregarDadosIniciais();
});

function configurarCabecalhoDatas() {
    const hoje = new Date();
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    document.getElementById('mes-atual').innerText = `${meses[hoje.getMonth()]}/${hoje.getFullYear()}`;
    document.getElementById('data-atual').innerText = hoje.toLocaleDateString('pt-BR');
}

async function carregarDadosIniciais() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;

    try {
        const resResumo = await fetch(`${API_URL}/resumo/${ano}/${mes}`);
        if(resResumo.ok) {
            const resumo = await resResumo.json();
            document.getElementById('dias-uteis-totais').innerText = resumo.dias_uteis_totais;
            document.getElementById('feriados-mes').innerText = resumo.feriados;
            let diasPassados = hoje.getDate();
            let uteisPassados = Math.floor(diasPassados * (resumo.dias_uteis_totais / 30)); 
            document.getElementById('dias-restantes').innerText = resumo.dias_uteis_totais - uteisPassados;
        }

        const resTransacoes = await fetch(`${API_URL}/transacoes/`);
        if(resTransacoes.ok) {
            transacoesDoMes = await resTransacoes.json();
            if (typeof atualizarGraficos === "function") atualizarGraficos(transacoesDoMes);
            renderizarTabela(transacoesDoMes);
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor.", error);
        mostrarToast("Erro de conexão com o banco de dados.", "error");
    }
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
    if(confirm("Tem certeza que deseja excluir este lançamento?")) {
        try {
            const resposta = await fetch(`${API_URL}/transacoes/${id}`, { method: 'DELETE' });
            if(resposta.ok) {
                mostrarToast("Lançamento excluído com sucesso!", "success");
                await carregarDadosIniciais(); 
            } else {
                mostrarToast("Erro ao excluir o lançamento.", "error");
            }
        } catch(error) {
            mostrarToast("Erro de conexão ao tentar excluir.", "error");
        }
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
            
            mostrarToast(metodo === 'PUT' ? 'Lançamento atualizado com sucesso!' : 'Lançamento salvo com sucesso!', 'success');
            await carregarDadosIniciais(); 
        } else {
            mostrarToast('Erro ao salvar. Verifique os dados.', 'error');
        }
    } catch (error) {
        mostrarToast('Servidor offline ou inacessível.', 'error');
    }
});


function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerText = mensagem;

    container.appendChild(toast);

    // Alterado para 8000 (8 segundos) para dar tempo de ler após o balanço
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 8000); 
}