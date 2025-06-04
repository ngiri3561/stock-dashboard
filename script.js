
const API_KEY = 'X3M4S2D1F6G7H8J9';
let currentStockSymbol = '';
let stockChart = null;
let comparisonStocks = [];

// DOM Elements
const searchInput = document.getElementById('stock-search');
const searchBtn = document.getElementById('search-btn');
const trendingStocksDropdown = document.getElementById('trending-stocks');
const stockNameElement = document.getElementById('stock-name');
const priceElement = document.getElementById('price');
const changeElement = document.getElementById('change');
const changePercentElement = document.getElementById('change-percent');
const volumeElement = document.getElementById('volume');
const chartCanvas = document.getElementById('stock-chart');
const addToCompareBtn = document.getElementById('add-to-compare');
const compareTableBody = document.querySelector('#compare-table tbody');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchTrendingStocks();
    setupEventListeners();
});

function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    trendingStocksDropdown.addEventListener('change', handleTrendingStockSelect);
    addToCompareBtn.addEventListener('click', addCurrentStockToComparison);
}

function handleSearch() {
    const symbol = searchInput.value.trim().toUpperCase();
    if (symbol) {
        fetchStockData(symbol);
    } else {
        alert('Please enter a stock symbol');
    }
}

function handleTrendingStockSelect(e) {
    const symbol = e.target.value;
    if (symbol) {
        fetchStockData(symbol);
    }
}

async function fetchTrendingStocks() {
    try {
        
        const trendingSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT'];
        
        trendingStocksDropdown.innerHTML = '<option value="">Select Trending Stock</option>';
        
        trendingSymbols.forEach(symbol => {
            const option = document.createElement('option');
            option.value = symbol;
            option.textContent = symbol;
            trendingStocksDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching trending stocks:', error);
        alert('Failed to load trending stocks');
    }
}

async function fetchStockData(symbol) {
    try {
        // Fetch quote data
        const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();
        
        if (quoteData['Note'] || quoteData['Information']) {
            throw new Error(quoteData['Note'] || quoteData['Information'] || 'API limit reached');
        }
        
        const quote = quoteData['Global Quote'];
        if (!quote) {
            throw new Error('No data found for this symbol');
        }
        
        // Fetch time series data for chart
        const timeSeriesUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;
        const timeSeriesResponse = await fetch(timeSeriesUrl);
        const timeSeriesData = await timeSeriesResponse.json();
        
        if (timeSeriesData['Note'] || timeSeriesData['Information']) {
            throw new Error(timeSeriesData['Note'] || timeSeriesData['Information'] || 'API limit reached');
        }
        
        const timeSeries = timeSeriesData['Time Series (Daily)'];
        if (!timeSeries) {
            throw new Error('No historical data found for this symbol');
        }
        
        // Update UI with the fetched data
        updateStockInfo(symbol, quote);
        updateStockChart(symbol, timeSeries);
        currentStockSymbol = symbol;
    } catch (error) {
        console.error('Error fetching stock data:', error);
        alert(`Error: ${error.message}`);
    }
}

function updateStockInfo(symbol, quote) {
    const price = parseFloat(quote['05. price']).toFixed(2);
    const change = parseFloat(quote['09. change']).toFixed(2);
    const changePercent = quote['10. change percent'];
    const volume = parseInt(quote['06. volume']).toLocaleString();
    
    stockNameElement.textContent = `${symbol} Stock Information`;
    priceElement.textContent = `$${price}`;
    changeElement.textContent = change;
    changePercentElement.textContent = changePercent;
    volumeElement.textContent = volume;
    
    // Set color based on change
    if (change >= 0) {
        changeElement.style.color = '#2ecc71';
        changePercentElement.style.color = '#2ecc71';
    } else {
        changeElement.style.color = '#e74c3c';
        changePercentElement.style.color = '#e74c3c';
    }
}

function updateStockChart(symbol, timeSeries) {
    // Prepare data for Chart.js
    const dates = Object.keys(timeSeries).reverse();
    const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));
    
    const chartData = {
        labels: dates,
        datasets: [{
            label: `${symbol} Closing Price`,
            data: prices,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.1
        }]
    };
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: 'Price (USD)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        },
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false,
            },
            legend: {
                position: 'top',
            }
        }
    };
    
    // Destroy previous chart if it exists
    if (stockChart) {
        stockChart.destroy();
    }
    
    // Create new chart
    stockChart = new Chart(chartCanvas, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });
}

function addCurrentStockToComparison() {
    if (!currentStockSymbol) {
        alert('Please search for a stock first');
        return;
    }
    
    // Check if stock is already in comparison
    if (comparisonStocks.includes(currentStockSymbol)) {
        alert('This stock is already in the comparison table');
        return;
    }
    
    // Add to comparison array
    comparisonStocks.push(currentStockSymbol);
    
    // Fetch the stock data again to display in comparison table
    fetchStockForComparison(currentStockSymbol);
}

async function fetchStockForComparison(symbol) {
    try {
        const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();
        
        if (quoteData['Note'] || quoteData['Information']) {
            throw new Error(quoteData['Note'] || quoteData['Information'] || 'API limit reached');
        }
        
        const quote = quoteData['Global Quote'];
        if (!quote) {
            throw new Error('No data found for this symbol');
        }
        
        addStockToComparisonTable(symbol, quote);
    } catch (error) {
        console.error('Error fetching stock for comparison:', error);
        alert(`Error adding ${symbol} to comparison: ${error.message}`);
    }
}

function addStockToComparisonTable(symbol, quote) {
    const price = parseFloat(quote['05. price']).toFixed(2);
    const change = parseFloat(quote['09. change']).toFixed(2);
    const changePercent = quote['10. change percent'];
    const volume = parseInt(quote['06. volume']).toLocaleString();
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${symbol}</td>
        <td>$${price}</td>
        <td class="${change >= 0 ? 'positive' : 'negative'}">${change}</td>
        <td class="${change >= 0 ? 'positive' : 'negative'}">${changePercent}</td>
        <td>${volume}</td>
        <td><button class="remove-btn" data-symbol="${symbol}">Remove</button></td>
    `;
    
    compareTableBody.appendChild(row);
    
    // Add event listener to the remove button
    row.querySelector('.remove-btn').addEventListener('click', (e) => {
        const symbolToRemove = e.target.getAttribute('data-symbol');
        removeStockFromComparison(symbolToRemove);
    });
}

function removeStockFromComparison(symbol) {
    // Remove from array
    comparisonStocks = comparisonStocks.filter(s => s !== symbol);
    
    // Remove from DOM
    const rows = compareTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        if (row.querySelector('td:first-child').textContent === symbol) {
            row.remove();
        }
    });
}