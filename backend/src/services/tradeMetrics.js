function roundCurrency(value) {
  return Number((value || 0).toFixed(2));
}

function calculateCharges(tradeInput) {
  const quantity = Number(tradeInput.quantity || 0);
  const entryPrice = Number(tradeInput.entryPrice ?? tradeInput.buyPrice ?? 0);
  const exitValue = tradeInput.exitPrice ?? tradeInput.sellPrice;
  const hasExitPrice = exitValue !== "" && exitValue !== null && exitValue !== undefined;
  const exitPrice = Number(hasExitPrice ? exitValue : 0);
  const turnover = quantity * (entryPrice + (exitPrice || 0));
  const rate = Number(tradeInput.brokeragePercent || 0);

  let brokerage = 0;
  if (tradeInput.segment === "options") {
    brokerage = quantity * rate;
  } else {
    brokerage = turnover * (rate / 100);
  }

  const gst = 0;
  const exchangeFee = 0;
  const sebiFee = 0;
  const stampDuty = 0;
  const totalCharges = brokerage + gst + exchangeFee + sebiFee + stampDuty;

  let grossPnL = 0;
  if (hasExitPrice) {
    grossPnL =
      tradeInput.side === "buy"
        ? (exitPrice - entryPrice) * quantity
        : (entryPrice - exitPrice) * quantity;
  }

  const netPnL = grossPnL - totalCharges;

  return {
    turnover: roundCurrency(turnover),
    charges: {
      brokerage: roundCurrency(brokerage),
      gst: roundCurrency(gst),
      exchangeFee: roundCurrency(exchangeFee),
      sebiFee: roundCurrency(sebiFee),
      stampDuty: roundCurrency(stampDuty),
      total: roundCurrency(totalCharges),
    },
    grossPnL: roundCurrency(grossPnL),
    netPnL: roundCurrency(netPnL),
  };
}

module.exports = { calculateCharges, roundCurrency };
