const wget = require('node-wget-promise');
const parse = require('csv-parse');
const fs = require('fs');
const { printTable } = require('console-table-printer');
const { finished } = require('stream/promises');
const { ALIGNMENTS } = require('console-table-printer/dist/src/utils/table-constants');

const Intervals = [5, 20, 60, 120];
const IntervalBegin = Intervals.reduce((prev, cur) => Math.max(prev, cur), 0);
const Stocks = [
    // 'RY', 'TD', 'BNS', 'CNR', 'SU', 
    // 'ENB', 'BMO', 'CM', 'CNQ', 'TRP', 
    // 'BCE', 'MFC', 'NTR', 'TRI', 'CP',
    // 'QSR', 'IMO', 'SLF', 'FIH-U.TO', 'BIP-UN.TO',
    // 'T','WCN', 'L', 'MG', 'TECK-B.TO', 'FTS',
    // 'PPL', 'SHOP', 'CSU', 'OVV.TO', 'ABX.TO',
    // 'WEED.TO', 'SAP', 'TECK-A.TO'
    '015760.KS', '096770.KS', '005380.KS', '055550.KS'
];

const TSX60 = [
    ['AEM.TO', 243.04], ['AQN.TO', 611.84], ['ATD-B.TO', 827.35], ['BCE.TO', 904.61], ['BMO.TO', 647.33],
    ['BNS.TO', 1210], ['ABX.TO', 1780], ['BHC.TO', 358.4], ['BAM-A.TO', 1580], ['BIP-UN.TO', 295.54],
    ['BPY-UN.TO', 436.89], ['CCL-B.TO', 167.7], ['GIB-A.TO', 221.48], ['CCO.TO', 397.64], ['CAR-UN.TO', 172.36],
    ['CM.TO', 449.09], ['CNR.TO', 708], ['CNQ.TO', 1180], ['CP.TO', 666.61], ['CTC-A.TO', 57.38],
    ['WEED.TO', 382.98], ['CVE.TO', 2020], ['CSU.TO', 21.19], ['DOL.TO', 310.27], ['EMA.TO', 253.73],
    ['ENB.TO', 2030], ['FM.TO', 690.41], ['FTS.TO', 469.4], ['FNV.TO', 191.02], ['WN.TO', 151.94],
    ['GIL.TO', 198.43], ['IMO.TO', 734.08], ['IPL.TO', 429.2], ['K.TO', 1260], ['KL.TO', 267.08],
    ['L.TO', 342.11], ['MG.TO', 301.51], ['MFC.TO', 1940], ['MRU.TO', 245.94], ['NA.TO', 337.44],
    ['NTR.TO', 570.21], ['OTEX.TO', 273.2], ['PPL.TO', 549.98], ['POW.TO', 622.03], ['QSR.TO', 306.98],
    ['RCI-B.TO', 393.77], ['RY.TO', 1430], ['SNC.TO', 175.55], ['SAP.TO', 412.72], ['SJR-B.TO', 476.28],
    ['SHOP.TO', 112.83], ['SLF.TO', 585.56], ['SU.TO', 1510], ['TRP.TO', 979], ['TECK-B.TO', 523.9],
    ['T.TO', 1360], ['TRI.TO', 495.66], ['TD.TO', 1820], ['WCN.TO', 261.68], ['WPM.TO', 450.05]
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
    return table;
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
        if (row[5] > row[20] && lastPrice == 0) buy(row, next);
        if (row[5] < row[20] && lastPrice > 0) sell(row, next);
    }

    if (lastPrice > 0) sell(back(table), { open: back(table).close });
    return {
        transactions, profit: {
            budget, gross, rate: gross / budget
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

const revise = (table) => {
    return table.map(row => {
        const ret = {};
        for (const [key, value] of Object.entries(row)) {
            if (typeof value === 'number') {
                ret[key] = value.toFixed(2);
            } else {
                ret[key] = value;
            }
        }
        return ret;
    });
}

(async function (stocks) {
    const tables = await Promise.all(stocks.map(async ([stock]) => {
        const fn = `csv/${stock}.csv`;
        try {
            await scrap(stock, fn);
        } catch (e) {
            console.error(`${stock} is missing.`)
            return;
        }
        const table = await parseCsv(fn);
        return calculateAverages(table);
    }));
    const totalShares = stocks.reduce((sum, [, shares]) => sum + shares, 0);

    const report = tables.map((table, index) => {
        const { transactions, profit } = doMethod(table);
        const begin = table[0].open;
        const end = back(table).close;
        const indexDiff = end - begin;
        const [ stock, shares ] = stocks[index];
        const ratio = shares / totalShares;
        const indexRate = indexDiff / begin * 100;
        const methodRate = profit.rate * 100;
        return {
            stock, shares, ratio, begin, end, 
            indexDiff, indexRate, indexProfit: indexRate * ratio,
            methodDiff: profit.gross, methodRate, methodProfit: methodRate * ratio
        };
    });
    printTable(revise(report));

    const indexProfit = report.reduce((sum, { indexProfit }) => sum + indexProfit, 0);
    const methodProfit = report.reduce((sum, { methodProfit }) => sum + methodProfit, 0);
    console.log(`Method > ${methodProfit.toFixed(2)}%, ${indexProfit.toFixed(2)}% < Index `)

})(TSX60);
