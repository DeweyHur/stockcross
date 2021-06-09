const wget = require('node-wget-promise');
const parse = require('csv-parse');
const fs = require('fs');
const { printTable } = require('console-table-printer');
const { finished } = require('stream/promises');

const Intervals = [5, 20, 60, 120];
const IntervalBegin = Intervals.reduce((prev, cur) => Math.max(prev, cur), 0);
const Stocks = [
    'RY', 'TD', 'BNS', 'CNR', 'SU', 
    'ENB', 'BMO', 'CM', 'CNQ', 'TRP', 
    'BCE', 'MFC', 'NTR', 'TRI', 'CP',
    'QSR', 'IMO', 'SLF', 'FIH-U.TO', 'BIP-UN.TO',
    'T','WCN', 'L', 'MG', 'TECK-B.TO', 'FTS',
    'PPL', 'SHOP', 'CSU', 'OVV.TO', 'ABX.TO',
    'WEED.TO', 'SAP', 'TECK-A.TO'
];

function back(arr) {
    return arr[arr.length - 1];
}

function calculateAverages(table) {
    for (let index = IntervalBegin; index < table.length; ++index) {
        Intervals.forEach(interval => {
            const average = table
                .slice(index - interval, index)
                .reduce((sum, item) => sum + item.close, 0) / interval;
            table[index][interval] = average;
        });
    }
}

function doMethod(table) {
    let lastPrice = 0;
    let transactions = [];
    let gross = 0;
    let budget = 0;

    const sell = (row, next) => {
        lastPrice = 0;
        const netProfit = next.open - back(transactions).price;
        gross += netProfit;
        transactions.push({
            date: row.date, action: 'SELL', price: next.open.toFixed(2), 5: row[5].toFixed(2), 20: row[20].toFixed(2),
            profit: netProfit.toFixed(2)
        });
    };

    const buy = (row, next) => {
        lastPrice = next.open;
        budget = budget || row.close;
        transactions.push({
            date: row.date, action: 'BUY', price: next.open.toFixed(2), 5: row[5].toFixed(2), 20: row[20].toFixed(2),
        });
    };

    for (let index = IntervalBegin; index < table.length - 1; ++index) {
        const row = table[index];
        const next = table[index + 1];
        if (row[5] > row[20] && lastPrice == 0) buy(row, next) ;
        if (row[5] < row[20] && lastPrice > 0) sell(row, next);
    }

    if (lastPrice > 0) sell(back(table), { open: back(table).close });
    return {
        transactions, profit: {
            budget: budget.toFixed(2), gross: gross.toFixed(2), ratio: ((gross / budget) * 100).toFixed(2)
        }
    };
}

const scrap = async (stock, fn) => {
    const query = `https://query1.finance.yahoo.com/v7/finance/download/${stock}?period1=1465344000&period2=1623110400&interval=1d&events=history&includeAdjustedClose=true`;
    if (!fs.existsSync(fn))
        await wget(query, { output: fn });
}

const parseCsv = async (fn) => {
    const parser = fs.createReadStream(fn).pipe(parse({ columns: true }));
    const prices = [];
    parser.on('readable', () => {
        while (record = parser.read()) {
            prices.push({
                date: record['Date'],
                open: Number.parseFloat(record['Open']),
                close: Number.parseFloat(record['Close']),
                volume: Number.parseInt(record['Volumn'])
            });
        }
    });
    await finished(parser);
    return prices;
}

Promise.all(Stocks.map(async (stock) => {
    const fn = `csv/${stock}.csv`;
    try {        
        await scrap(stock, fn);
    } catch (e) {
        console.error(`${stock} is missing.`)
        return;
    }
    const table = await parseCsv(fn);
    calculateAverages(table);
    const { transactions, profit } = doMethod(table);
    console.log(`${stock} >>> CAD ${profit.budget} -> ${profit.gross} (${profit.ratio}%)`);
    // printTable(transactions);
}));