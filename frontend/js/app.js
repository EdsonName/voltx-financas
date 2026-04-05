// =========================================
// CONFIGURAÇÕES INICIAIS
// =========================================
const API_URL = 'http://127.0.0.1:8000';
let transacoesDoMes = [];

// Quando a página carregar, executamos isso:
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

// =========================================
// COMUNICAÇÃO COM A API (BACKEND)
// =========================================
async function carregarDadosIniciais() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;

    try {
        // Busca o resumo de tempo
        const resResumo = await fetch(`${API_URL}/resumo/${ano}/${mes}`);
        if(resResumo.ok) {
            const resumo = await resResumo.json();
            document.getElementById('dias-uteis-totais').innerText = resumo.dias_uteis_totais;
            document.getElementById('feriados-mes').innerText = resumo.feriados;
            
            // Cálculo simples de dias restantes
            let diasPassados = hoje.getDate();
            let uteisPassados = Math.floor(diasPassados * (resumo.dias_uteis_totais / 30)); 
            document.getElementById('dias-restantes').innerText = resumo.dias_uteis_totais - uteisPassados;
        }

        // Busca todas as transações
        const resTransacoes = await fetch(`${API_URL}/transacoes/`);
        if(resTransacoes.ok) {
            transacoesDoMes = await resTransacoes.json();
            
            // Atualiza gráficos e tabela com os dados novos
            if (typeof atualizarGraficos === "function") atualizarGraficos(transacoesDoMes);
            renderizarTabela(transacoesDoMes);
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor.", error);
        mostrarToast("Erro de conexão com o servidor backend.", "error");
    }
}

// =========================================
// RENDERIZAÇÃO DA TABELA DE HISTÓRICO
// =========================================
function renderizarTabela(transacoes) {
    const tbody = document.getElementById('corpo-tabela');
    tbody.innerHTML = ''; // Limpa a tabela antes de desenhar

    transacoes.forEach(t => {
        const tr = document.createElement('tr');
        
        // Formata data e valor para o padrão brasileiro
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

// =========================================
// FUNÇÕES DE AÇÃO (CRIAR, EDITAR, EXCLUIR)
// =========================================

// Puxa os dados da tabela de volta para o formulário para edição
function prepararEdicao(id) {
    const transacao = transacoesDoMes.find(t => t.id === id);
    if(transacao) {
        document.getElementById('tipo').value = transacao.tipo;
        document.getElementById('descricao').value = transacao.descricao;
        document.getElementById('valor').value = transacao.valor;
        document.getElementById('data').value = transacao.data;
        document.getElementById('categoria').value = transacao.categoria;
        
        // Salva o ID oculto e muda o texto do botão
        document.getElementById('transacao-id-editando').value = id;
        document.querySelector('#form-transacao button').innerText = 'Atualizar Lançamento';
        
        // Rola a tela suavemente para cima (para o formulário)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Deleta uma transação após confirmação
async function deletarTransacao(id) {
    if(confirm("Tem certeza que deseja excluir este lançamento?")) {
        try {
            const resposta = await fetch(`${API_URL}/transacoes/${id}`, { method: 'DELETE' });
            if(resposta.ok) {
                mostrarToast("Lançamento excluído com sucesso!", "success");
                await carregarDadosIniciais(); // Atualiza a tela
            } else {
                mostrarToast("Erro ao excluir o lançamento.", "error");
            }
        } catch(error) {
            console.error("Erro", error);
            mostrarToast("Erro de conexão ao tentar excluir.", "error");
        }
    }
}

// Salva o formulário (Criar Novo OU Atualizar Existente)
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
    let metodo = 'POST'; // Padrão é criar (novo)

    // Se tiver um ID oculto preenchido, mudamos a rota para PUT (Editar)
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
            // Limpa o formulário e o ID oculto
            document.getElementById('form-transacao').reset();
            document.getElementById('transacao-id-editando').value = ""; 
            
            // Volta o botão ao estado normal
            document.querySelector('#form-transacao button').innerText = 'Salvar'; 
            
            // Dispara o Toast animado
            mostrarToast(metodo === 'PUT' ? 'Lançamento atualizado com sucesso!' : 'Lançamento salvo com sucesso!', 'success');
            
            // Recarrega os gráficos e a tabela
            await carregarDadosIniciais(); 
        } else {
            mostrarToast('Erro ao salvar. Verifique os dados digitados.', 'error');
        }
    } catch (error) {
        console.error("Erro ao salvar", error);
        mostrarToast('Não foi possível conectar ao servidor.', 'error');
    }
});

// =========================================
// SISTEMA DE NOTIFICAÇÕES (TOAST)
// =========================================
function mostrarToast(mensagem, tipo = 'success') {
    const container = document.getElementById('toast-container');
    
    // Cria o elemento visual do toast
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerText = mensagem;

    // Adiciona na tela
    container.appendChild(toast);

    // Remove automaticamente após 3.5 segundos
    setTimeout(() => {
        toast.classList.add('fade-out');
        
        // Aguarda a animação de saída terminar para remover do HTML e limpar a memória
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3500);
}