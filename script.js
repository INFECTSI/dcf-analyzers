document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const analyzeBtn = document.getElementById('analyze-btn');
    const tickerInput = document.getElementById('ticker');
    const scenarioButtons = document.querySelectorAll('.btn-scenario');
    const waccSlider = document.getElementById('custom-wacc');
    const growthSlider = document.getElementById('custom-growth');
    const waccValue = document.getElementById('wacc-value');
    const growthValue = document.getElementById('growth-value');
    const loadingElement = document.getElementById('loading');
    const resultsContent = document.getElementById('results-content');
    
    // Initialisation
    let currentScenario = 'base';
    let chart = null;
    
    // Écouteurs d'événements
    scenarioButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            scenarioButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentScenario = this.dataset.scenario;
        });
    });
    
    waccSlider.addEventListener('input', function() {
        waccValue.textContent = `${this.value}%`;
    });
    
    growthSlider.addEventListener('input', function() {
        growthValue.textContent = `${this.value}%`;
    });
    
    analyzeBtn.addEventListener('click', analyzeStock);
    
    // Fonction principale d'analyse
    async function analyzeStock() {
        const ticker = tickerInput.value.trim().toUpperCase();
        if (!ticker) {
            alert('Veuillez entrer un symbole boursier');
            return;
        }
        
        // Afficher le chargement
        loadingElement.style.display = 'block';
        resultsContent.classList.add('hidden');
        
        try {
            // Simulation de données (remplacer par un appel API réel)
            const analysisData = await simulateDCFAnalysis(ticker);
            
            // Afficher les résultats
            displayResults(analysisData);
            
        } catch (error) {
            console.error('Erreur d\'analyse:', error);
            alert('Une erreur est survenue lors de l\'analyse');
        } finally {
            loadingElement.style.display = 'none';
            resultsContent.classList.remove('hidden');
        }
    }
    
    // Simulation d'analyse DCF (à remplacer par votre logique réelle)
    async function simulateDCFAnalysis(ticker) {
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Données simulées (remplacer par des données réelles)
        return {
            companyName: `${ticker} Corporation`,
            currentPrice: (Math.random() * 500 + 50).toFixed(2),
            intrinsicValue: (Math.random() * 600 + 40).toFixed(2),
            marginOfSafety: ((Math.random() * 30) - 10).toFixed(1),
            financialData: {
                ebit: Math.round(Math.random() * 100000 + 50000).toLocaleString(),
                cfo: Math.round(Math.random() * 90000 + 40000).toLocaleString(),
                totalDebt: Math.round(Math.random() * 80000 + 20000).toLocaleString(),
                cash: Math.round(Math.random() * 50000 + 10000).toLocaleString()
            },
            assumptions: {
                wacc: `${waccSlider.value}%`,
                terminalGrowth: `${growthSlider.value}%`,
                projectionYears: currentScenario === 'optimiste' ? 7 : currentScenario === 'pessimiste' ? 10 : 8
            },
            scenarios: [
                {
                    name: 'Optimiste',
                    value: (Math.random() * 700 + 100).toFixed(2),
                    margin: ((Math.random() * 40) + 5).toFixed(1),
                    wacc: '7.0%',
                    growth: '4.5%'
                },
                {
                    name: 'Base',
                    value: (Math.random() * 600 + 80).toFixed(2),
                    margin: ((Math.random() * 20) - 5).toFixed(1),
                    wacc: '8.0%',
                    growth: '3.0%'
                },
                {
                    name: 'Pessimiste',
                    value: (Math.random() * 500 + 50).toFixed(2),
                    margin: ((Math.random() * 10) - 20).toFixed(1),
                    wacc: '9.0%',
                    growth: '1.5%'
                }
            ],
            projections: Array.from({length: 10}, (_, i) => ({
                year: i + 1,
                value: Math.round(Math.random() * 20000 + 5000)
            }))
        };
    }
    
    // Affichage des résultats
    function displayResults(data) {
        // Informations de base
        document.getElementById('company-name').textContent = data.companyName;
        document.getElementById('current-price').textContent = `$${data.currentPrice}`;
        document.getElementById('intrinsic-value').textContent = `$${data.intrinsicValue}`;
        document.getElementById('margin-of-safety').textContent = `${data.marginOfSafety}%`;
        
        // Données financières
        document.getElementById('ebit').textContent = data.financialData.ebit;
        document.getElementById('cfo').textContent = data.financialData.cfo;
        document.getElementById('total-debt').textContent = data.financialData.totalDebt;
        document.getElementById('cash').textContent = data.financialData.cash;
        
        // Hypothèses
        document.getElementById('wacc').textContent = data.assumptions.wacc;
        document.getElementById('terminal-growth').textContent = data.assumptions.terminalGrowth;
        document.getElementById('projection-years').textContent = data.assumptions.projectionYears;
        
        // Comparaison des scénarios
        const scenarioTable = document.getElementById('scenario-comparison');
        scenarioTable.innerHTML = data.scenarios.map(scenario => `
            <tr>
                <td>${scenario.name}</td>
                <td>$${scenario.value}</td>
                <td>${scenario.margin}%</td>
                <td>${scenario.wacc}</td>
                <td>${scenario.growth}</td>
            </tr>
        `).join('');
        
        // Graphique
        renderChart(data.projections);
    }
    
    // Rendu du graphique
    function renderChart(projections) {
        const ctx = document.getElementById('dcf-chart').getContext('2d');
        
        if (chart) {
            chart.destroy();
        }
        
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: projections.map(p => `Année ${p.year}`),
                datasets: [{
                    label: 'Projections FCFF (M$)',
                    data: projections.map(p => p.value),
                    borderColor: '#2962ff',
                    backgroundColor: 'rgba(41, 98, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.parsed.y.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return `$${value.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Démarrer une analyse automatique au chargement
    analyzeStock();
});