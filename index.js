const { printTable } = require('console-table-printer');
const { crawl } = require('./lib/crawler.js');
const market = require('./lib/market.js');
const methods = require('./lib/method.js');
const { getReport } = require('./lib/reporter.js');

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

const printOverview = async ({ method, symbol }) => {
    const stocks = market[symbol];
    if (!stocks) {
        console.error(`Invalid symbol: ${symbol || ""}`);
        return;
    }
    const marketData = await crawl(stocks);
    const results = marketData.map(x => methods[method](x));
    const report = getReport(stocks, marketData, results);
    printTable(revise(report));

    const indexProfit = report.reduce((sum, { indexProfit }) => sum + indexProfit, 0);
    const methodProfit = report.reduce((sum, { methodProfit }) => sum + methodProfit, 0);
    console.log(`Method > ${methodProfit.toFixed(2)}%, ${indexProfit.toFixed(2)}% < Index `)
}

const printOne = async (symbol) => {
    const marketData = await crawl([symbol]);
}

const printUsage = () => {
    console.log("Usage: node index.js <overview/analysis> <MVA> <stock>");
}

if (process.argc < 4) {
    printUsage();
    return;
}

const [ cmd, method, symbol ] = process.argv.slice(2);
if( !methods[method] ) {
    printUsage();
    return;
}

switch (cmd) {
    case "overview":
        printOverview({ method, symbol });
        break;
    case "analysis":
        break;
    default:
        printUsage();
        break;
}
