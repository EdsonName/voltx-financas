let graficoPizza = null;
let graficoBarras = null;

function atualizarGraficos(transacoes) {
    // Separa totais para o gráfico de Pizza
    let totalReceitas = 0;
    let totalDespesas = 0;

    // Arrays para o gráfico de Barras (Evolução por dia de lançamento)
    let datasLançamentos = [];
    let valoresReceitas = [];
    let valoresDespesas = [];

    // Processa os dados vindos do banco
    transacoes.forEach(t => {
        if (t.tipo === 'receita') {
            totalReceitas += t.valor;
        } else {
            totalDespesas += t.valor;
        }

        // Lógica simplificada para o gráfico de barras (usando as datas dos lançamentos)
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

    renderizarPizza(totalReceitas, totalDespesas);
    renderizarBarras(datasLançamentos, valoresReceitas, valoresDespesas);
}

function renderizarPizza(receitas, despesas) {
    const ctx = document.getElementById('pizzaChart').getContext('2d');
    
    // Se o gráfico já existir, destrói para desenhar o novo atualizado
    if (graficoPizza) graficoPizza.destroy();

    graficoPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Receitas', 'Despesas'],
            datasets: [{
                data: [receitas, despesas],
                backgroundColor: ['#28a745', '#dc3545'], // Verde e Vermelho
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
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
                {
                    label: 'Receitas',
                    data: receitas,
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Despesas',
                    data: despesas,
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            onClick: (event, elements) => {
                // Aqui fica o preparo para a v0.0.2 (Gráfico Clicável)
                if (elements.length > 0) {
                    const barraClicada = elements[0];
                    const datasetIndex = barraClicada.datasetIndex;
                    const dataIndex = barraClicada.index;
                    const tipo = graficoBarras.data.datasets[datasetIndex].label;
                    const dataReferencia = graficoBarras.data.labels[dataIndex];
                    
                    alert(`Futuro detalhamento da v0.0.2:\nVocê clicou em ${tipo} do dia ${dataReferencia}.`);
                }
            }
        }
    });
}