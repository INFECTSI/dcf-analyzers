document.addEventListener('DOMContentLoaded', function() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const loadingElement = document.getElementById('loading');
    const resultsContent = document.getElementById('results-content');
    
    analyzeBtn.addEventListener('click', analyzeStock);
    
    async function analyzeStock() {
        const ticker = document.getElementById('ticker').value.trim().toUpperCase();
        if (!ticker) {
            alert('Veuillez entrer un symbole boursier');
            return;
        }
        
        loadingElement.style.display = 'block';
        resultsContent.classList.add('hidden');
        
        try {
            // 1. Récupérer les données
            const stockData = await fetchStockData(ticker);
            
            // 2. Calculer la valorisation DCF
            const dcfResults = calculateDCF(stockData);
            
            // 3. Afficher les résultats
            displayResults(ticker, stockData, dcfResults);
            
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors de l\'analyse. Voir la console pour les détails.');
        } finally {
            loadingElement.style.display = 'none';
            resultsContent.classList.remove('hidden');
        }
    }
    
    async function fetchStockData(ticker) {
        const response = await fetch(`https://query1.finance.yahoo.com/v11/finance/quoteSummary/${ticker}?modules=financialData,defaultKeyStatistics`);
        const data = await response.json();
        
        if (!data.quoteSummary || data.quoteSummary.error) {
            throw new Error('Données non disponibles pour ce ticker');
        }
        
        return {
            currentPrice: data.quoteSummary.result[0].financialData.currentPrice.raw,
            freeCashFlow: data.quoteSummary.result[0].financialData.freeCashflow.raw,
            revenueGrowth: data.quoteSummary.result[0].financialData.revenueGrowth.raw,
            debt: data.quoteSummary.result[0].financialData.totalDebt.raw,
            cash: data.quoteSummary.result[0].financialData.totalCash.raw,
            shares: data.quoteSummary.result[0].defaultKeyStatistics.sharesOutstanding.raw
        };
    }
    
    function calculateDCF(data) {
        // Hypothèses de base
        const projectionYears = 5;
        const terminalGrowthRate = 0.03;
        const wacc = 0.08; // Weighted Average Cost of Capital
        
        // Calcul des flux de trésorerie projetés
        const projections = [];
        let currentFCF = data.freeCashFlow;
        
        for (let i = 0; i < projectionYears; i++) {
            currentFCF *= (1 + data.revenueGrowth * 0.7); // Croissance réduite
            projections.push({
                year: i + 1,
                fcf: currentFCF
            });
        }
        
        // Valeur terminale
        const terminalValue = (currentFCF * (1 + terminalGrowthRate)) / (wacc - terminalGrowthRate);
        
        // Actualisation des flux
        let presentValue = 0;
        
        projections.forEach(proj => {
            presentValue += proj.fcf / Math.pow(1 + wacc, proj.year);
        });
        
        presentValue += terminalValue / Math.pow(1 + wacc, projectionYears);
        
        // Valorisation equity
        const equityValue = presentValue - data.debt + data.cash;
        const intrinsicValue = equityValue / data.shares;
        
        return {
            intrinsicValue,
            currentPrice: data.currentPrice,
            marginOfSafety: ((intrinsicValue - data.currentPrice) / data.currentPrice * 100),
            projections
        };
    }
    
    function displayResults(ticker, stockData, dcfResults) {
        document.getElementById('company-name').textContent = `${ticker}`;
        document.getElementById('current-price').textContent = `$${stockData.currentPrice.toFixed(2)}`;
        document.getElementById('intrinsic-value').textContent = `$${dcfResults.intrinsicValue.toFixed(2)}`;
        document.getElementById('margin-of-safety').textContent = `${dcfResults.marginOfSafety.toFixed(1)}%`;
        
        // Remplir le tableau des données financières
        const financialTable = document.getElementById('financial-data');
        financialTable.innerHTML = `
            <tr>
                <td>Free Cash Flow (M$)</td>
                <td>${(stockData.freeCashFlow / 1e6).toFixed(2)}</td>
            </tr>
            <tr>
                <td>Croissance revenus</td>
                <td>${(stockData.revenueGrowth * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <td>Dette totale (M$)</td>
                <td>${(stockData.debt / 1e6).toFixed(2)}</td>
            </tr>
            <tr>
                <td>Trésorerie (M$)</td>
                <td>${(stockData.cash / 1e6).toFixed(2)}</td>
            </tr>
        `;
        
        // Afficher le graphique
        renderChart(dcfResults.projections);
    }
    
    function renderChart(projections) {
        const ctx = document.getElementById('dcf-chart').getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: projections.map(p => `Année ${p.year}`),
                datasets: [{
                    label: 'Free Cash Flow (M$)',
                    data: projections.map(p => p.fcf / 1e6),
                    backgroundColor: 'rgba(41, 98, 255, 0.7)',
                    borderColor: 'rgba(41, 98, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Millions $'
                        }
                    }
                }
            }
        });
    }
});