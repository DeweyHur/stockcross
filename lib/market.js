module.exports = {
    TSX60: [
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
    ],
    calcTotalShares: (stocks) => stocks.reduce((sum, [, shares]) => sum + shares, 0),
};