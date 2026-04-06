let graficoPizza = null;
let graficoBarras = null;

// =========================================
// RENDERIZAÇÃO DOS GRÁFICOS
// =========================================
function atualizarGraficos(transacoes) {
    // PROTEÇÃO MÁXIMA: Se o mês estiver vazio, zera os gráficos da tela!
    if (!transacoes || transacoes.length === 0) {
        if (graficoPizza) { graficoPizza.destroy(); graficoPizza = null; }
        if (graficoBarras) { graficoBarras.destroy(); graficoBarras = null; }
        return; 
    }

    let totalReceitas = 0;
    let totalDespesas = 0;
    let datasLançamentos = [];
    let valoresReceitas = [];
    let valoresDespesas = [];

    transacoes.forEach(t => {
        if (t.tipo === 'receita') { totalReceitas += t.valor; } 
        else { totalDespesas += t.valor; }

        if (!datasLançamentos.includes(t.data)) {
            datasLançamentos.push(t.data);
            valoresReceitas.push(t.tipo === 'receita' ? t.valor : 0);
            valoresDespesas.push(t.tipo === 'despesa' ? t.valor : 0);
        } else {
            let index = datasLançamentos.indexOf(t.data);
            if(t.tipo === 'receita') valoresReceitas[index] += t.valor;
            if(t.tipo === 'despesa') valoresDespesas[index] += t.valor;
        }
    });

    const dadosOrdenados = datasLançamentos.map((data, index) => {
        return { data: data, receita: valoresReceitas[index], despesa: valoresDespesas[index] };
    }).sort((a, b) => new Date(a.data) - new Date(b.data));

    renderizarPizza(totalReceitas, totalDespesas);
    renderizarBarras(
        dadosOrdenados.map(d => d.data), 
        dadosOrdenados.map(d => d.receita), 
        dadosOrdenados.map(d => d.despesa)
    );
}

function renderizarPizza(receitas, despesas) {
    const ctx = document.getElementById('pizzaChart').getContext('2d');
    if (graficoPizza) graficoPizza.destroy();

    graficoPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Receitas', 'Despesas'],
            datasets: [{
                data: [receitas, despesas],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 1
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderizarBarras(labels, receitas, despesas) {
    const ctx = document.getElementById('barrasChart').getContext('2d');
    if (graficoBarras) graficoBarras.destroy();

    graficoBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Receitas', data: receitas, backgroundColor: '#28a745' },
                { label: 'Despesas', data: despesas, backgroundColor: '#dc3545' }
            ]
        },
        options: {
            responsive: true,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const barraClicada = elements[0];
                    const datasetIndex = barraClicada.datasetIndex;
                    const dataIndex = barraClicada.index;
                    
                    const tipoLabel = graficoBarras.data.datasets[datasetIndex].label; 
                    const dataReferencia = graficoBarras.data.labels[dataIndex];
                    const tipo = tipoLabel === 'Receitas' ? 'receita' : 'despesa';
                    
                    abrirModalDetalhes(dataReferencia, tipo);
                }
            }
        }
    });
}

// =========================================
// LÓGICA DO MODAL DE DETALHES
// =========================================
function abrirModalDetalhes(dataStr, tipo) {
    const modal = document.getElementById('modal-detalhes');
    const titulo = document.getElementById('modal-titulo');
    const lista = document.getElementById('lista-detalhes');

    const dataFormatada = dataStr.split('-').reverse().join('/');
    const nomeTipo = tipo === 'receita' ? 'Receitas' : 'Despesas';
    titulo.innerText = `${nomeTipo} em ${dataFormatada}`;

    lista.innerHTML = '';
    const transacoesDoDia = transacoesDoMes.filter(t => t.data === dataStr && t.tipo === tipo);

    let totalDia = 0;
    transacoesDoDia.forEach(t => {
        const li = document.createElement('li');
        li.className = 'detalhe-item';
        const valorFormatado = t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        li.innerHTML = `
            <span><strong>${t.descricao}</strong> <small>(${t.categoria})</small></span> 
            <span class="${tipo === 'receita' ? 'receita-text' : 'despesa-text'}">${valorFormatado}</span>
        `;
        lista.appendChild(li);
        totalDia += t.valor;
    });

    const liTotal = document.createElement('li');
    liTotal.className = 'detalhe-total';
    liTotal.innerHTML = `
        <span>TOTAL:</span> 
        <span class="${tipo === 'receita' ? 'receita-text' : 'despesa-text'}">
            ${totalDia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
    `;
    lista.appendChild(liTotal);

    modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    const btnFechar = document.getElementById('btn-fechar-modal');
    if(btnFechar) {
        btnFechar.addEventListener('click', () => {
            document.getElementById('modal-detalhes').style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('modal-detalhes');
        if(e.target === modal) {
            modal.style.display = 'none';
        }
    });
});