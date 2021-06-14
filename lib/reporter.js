const { back } = require('./util.js');
const { calcTotalShares } = require('./market.js');

module.exports = {
    getReport: (stocks, marketData, results) => {
        const totalShares = calcTotalShares(stocks);
        return marketData.map((row, index) => {
            const begin = row[0].open;
            const end = back(row).close;
            const indexDiff = end - begin;
            const [stock, shares] = stocks[index];
            const ratio = shares / totalShares;
            const indexRate = indexDiff / begin * 100;
            const { profit } = results[index];
            const methodRate = profit.rate * 100;
            return {
                stock, shares, ratio, begin, end,
                indexDiff, indexRate, indexProfit: indexRate * ratio,
                methodDiff: profit.gross, methodRate, methodProfit: methodRate * ratio
            };
        })
    }
};