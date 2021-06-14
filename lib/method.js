const { back } = require('./util.js');

module.exports = {
    MVA: (table) => {
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

        for (let index = 0; index < table.length - 1; ++index) {
            const row = table[index];
            const next = table[index + 1];
            if (row[5] > row[20] && lastPrice == 0) buy(row, next);
            if (row[5] < row[20] && lastPrice > 0) sell(row, next);
        }

        if (lastPrice > 0) sell(back(table), { open: back(table).close });
        return {
            transactions, 
            profit: {
                budget, gross, rate: gross / budget
            }
        };
    },
};