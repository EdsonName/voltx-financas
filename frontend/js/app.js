// URL base do nosso servidor Python (FastAPI)
const API_URL = 'http://127.0.0.1:8000';

// Variável para guardar os dados e passar para os gráficos
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

async function carregarDadosIniciais() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;

    try {
        // Busca o resumo de tempo (dias úteis e feriados) do Python
        const resResumo = await fetch(`${API_URL}/resumo/${ano}/${mes}`);
        if(resResumo.ok) {
            const resumo = await resResumo.json();
            document.getElementById('dias-uteis-totais').innerText = resumo.dias_uteis_totais;
            document.getElementById('feriados-mes').innerText = resumo.feriados;
            
            // Cálculo simples temporário de dias restantes (na v0.0.2 faremos exato com feriados passados)
            let diasPassados = hoje.getDate();
            let uteisPassados = Math.floor(diasPassados * (resumo.dias_uteis_totais / 30)); 
            document.getElementById('dias-restantes').innerText = resumo.dias_uteis_totais - uteisPassados;
        }

        // Busca todas as transações do banco de dados
        const resTransacoes = await fetch(`${API_URL}/transacoes/`);
        if(resTransacoes.ok) {
            transacoesDoMes = await resTransacoes.json();
            // Chama a função que está no arquivo charts.js para desenhar os gráficos!
            if (typeof atualizarGraficos === "function") {
                atualizarGraficos(transacoesDoMes);
            }
        }
    } catch (error) {
        console.error("Erro ao conectar com o servidor Python. Ele está rodando?", error);
    }
}

// Configurando o botão de "Salvar" do formulário
document.getElementById('form-transacao').addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar

    const novaTransacao = {
        tipo: document.getElementById('tipo').value,
        descricao: document.getElementById('descricao').value,
        valor: parseFloat(document.getElementById('valor').value),
        data: document.getElementById('data').value,
        categoria: document.getElementById('categoria').value
    };

    try {
        // Envia para o Python salvar no SQLite
        const resposta = await fetch(`${API_URL}/transacoes/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaTransacao)
        });

        if(resposta.ok) {
            alert('Lançamento salvo com sucesso!');
            document.getElementById('form-transacao').reset(); // Limpa o formulário
            await carregarDadosIniciais(); // Recarrega os gráficos atualizados
        } else {
            alert('Erro ao salvar. Verifique os dados.');
        }
    } catch (error) {
        console.error("Erro ao enviar dados", error);
        alert('Não foi possível conectar ao servidor.');
    }
});
