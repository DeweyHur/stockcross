const wget = require('node-wget-promise');
const parse = require('csv-parse');
const fs = require('fs');
const { finished } = require('stream/promises');

const Intervals = [5, 20, 60, 120];
const IntervalBegin = Intervals.reduce((prev, cur) => Math.max(prev, cur), 0);

const scrap = async (stock, fn) => {
    const query = `https://query1.finance.yahoo.com/v7/finance/download/${stock}?period1=1465344000&period2=1623110400&interval=1d&events=history&includeAdjustedClose=true`;
    if (!fs.existsSync(fn))
        await wget(query, { output: fn });
};

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
};

const calculateAverages = (table) => {
    for (let index = IntervalBegin; index < table.length; ++index) {
        Intervals.forEach(interval => {
            const average = table
                .slice(index - interval, index)
                .reduce((sum, item) => sum + item.close, 0) / interval;
            table[index][interval] = average;
        });
    }
    return table;
};

module.exports = {
    crawl: async (stocks) => {
        const tables = await Promise.all(stocks.map(async ([stock]) => {
            const fn = `csv/${stock}.csv`;
            try {
                await scrap(stock, fn);
            } catch (e) {
                console.error(`${stock} is missing.`)
                return;
            }
            const table = await parseCsv(fn);
            return calculateAverages(table).slice(IntervalBegin);
        }));    
        return tables;
    }
};