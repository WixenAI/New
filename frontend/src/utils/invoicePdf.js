import { jsPDF } from "jspdf";
import { resolveAssetUrl } from "./assets";

function formatNumberValue(value, { minimumFractionDigits = 0, maximumFractionDigits = 0 } = {}) {
  const amount = Number(value ?? 0);

  if (Number.isNaN(amount)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

function formatCurrencyValue(value, fallback = "INR 0.00") {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return fallback;
  }

  const normalizedAmount = Math.abs(amount) < 0.005 ? 0 : amount;
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(normalizedAmount));

  return `${normalizedAmount < 0 ? "-" : ""}INR ${formattedAmount}`;
}

function formatDateValue(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimestampValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSupportLine(broker) {
  const supportText =
    broker?.documents?.supportText || "For support, contact your broker operations desk. All figures are in INR.";
  const contactParts = [broker?.contact?.supportDesk, broker?.contact?.phone, broker?.contact?.email].filter(Boolean);

  return contactParts.length ? `${supportText} ${contactParts.join(" | ")}` : supportText;
}

async function urlToDataUrl(url) {
  if (!url) {
    return null;
  }

  const response = await fetch(resolveAssetUrl(url));
  if (!response.ok) {
    return null;
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImageFormat(dataUrl) {
  if (!dataUrl) {
    return undefined;
  }

  return dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg") ? "JPEG" : "PNG";
}

function paintPage(doc) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), "F");
}

function drawImageContained(doc, image, x, y, width, height, { border = true, padding = 6 } = {}) {
  if (border) {
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, width, height, 6, 6);
  }

  if (!image) {
    return;
  }

  const props = doc.getImageProperties(image);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const scale = Math.min(innerWidth / props.width, innerHeight / props.height);
  const renderWidth = props.width * scale;
  const renderHeight = props.height * scale;
  const renderX = x + padding + (innerWidth - renderWidth) / 2;
  const renderY = y + padding + (innerHeight - renderHeight) / 2;

  doc.addImage(image, getImageFormat(image), renderX, renderY, renderWidth, renderHeight, undefined, "FAST");
}

function drawAlignedLines(doc, lines, x, y, width, align, lineHeight) {
  lines.forEach((line, index) => {
    const lineY = y + index * lineHeight;
    const lineX = align === "right" ? x + width - 4 : align === "center" ? x + width / 2 : x + 4;
    doc.text(String(line), lineX, lineY, { align });
  });
}

function setPnLTextColor(doc, amount) {
  const numericAmount = Number(amount || 0);

  if (numericAmount > 0) {
    doc.setTextColor(22, 163, 74);
    return;
  }

  if (numericAmount < 0) {
    doc.setTextColor(220, 38, 38);
    return;
  }

  doc.setTextColor(17, 24, 39);
}

function getTableColumns() {
  return [
    {
      key: "date",
      label: "DATE",
      width: 58,
      align: "left",
      wrap: false,
      getValue: (trade) => formatDateValue(trade.tradedAt),
    },
    {
      key: "symbol",
      label: "SYMBOL",
      width: 115,
      align: "left",
      wrap: true,
      getValue: (trade) => trade.stockName || trade.symbol || "-",
    },
    {
      key: "side",
      label: "SIDE",
      width: 42,
      align: "center",
      wrap: false,
      getValue: (trade) => String(trade.side || "-").toUpperCase(),
    },
    {
      key: "quantity",
      label: "QTY",
      width: 38,
      align: "right",
      wrap: false,
      getValue: (trade) => formatNumberValue(trade.quantity),
    },
    {
      key: "entry",
      label: "ENTRY",
      width: 74,
      align: "right",
      wrap: false,
      getValue: (trade) => formatCurrencyValue(trade.buyPrice ?? trade.entryPrice),
    },
    {
      key: "exit",
      label: "EXIT",
      width: 74,
      align: "right",
      wrap: false,
      getValue: (trade) => formatCurrencyValue(trade.sellPrice ?? trade.exitPrice),
    },
    {
      key: "brokerage",
      label: "BROKERAGE",
      width: 72,
      align: "right",
      wrap: false,
      getValue: (trade) => formatCurrencyValue(trade.charges?.total),
    },
    {
      key: "netPnL",
      label: "NET P&L",
      width: 78,
      align: "right",
      wrap: false,
      getValue: (trade) => formatCurrencyValue(trade.netPnL),
    },
  ];
}

function drawHeader(doc, broker, client, statementNumber, filters, logoImage, margin, pageWidth) {
  let y = margin;
  const brokerageHouseName = broker?.branding?.brokerageHouseName || broker?.name || "Brokerage House";
  const rightBlockWidth = 186;
  const rightBlockX = pageWidth - margin - rightBlockWidth;
  const labelWidth = 64;

  if (logoImage) {
    doc.addImage(logoImage, getImageFormat(logoImage), margin, y, 42, 42, undefined, "FAST");
  } else {
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, y, 42, 42, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text((broker?.branding?.logoText || "BP").slice(0, 2), margin + 21, y + 27, { align: "center" });
  }

  doc.setTextColor(17, 24, 39);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(brokerageHouseName, margin + 52, y + 13);
  doc.setFontSize(12);
  doc.text(broker?.documents?.statementTitle || "Closed Trade Statement", margin + 52, y + 29);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(broker?.documents?.statementSubtitle || "Portfolio P&L Report", margin + 52, y + 42);

  const identityRows = [
    ["Client", client?.fullName || "-"],
    ["Contact", client?.phone || "-"],
    [broker?.documents?.clientLabel || "Client ID", client?.idCode || client?.clientCode || "-"],
    ["Statement No", statementNumber || "-"],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  identityRows.forEach(([label, value], index) => {
    const rowY = y + 2 + index * 14;
    doc.text(label, rightBlockX, rowY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(String(value), rightBlockX + labelWidth, rowY, { maxWidth: rightBlockWidth - labelWidth });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
  });

  y += 58;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("From Date", margin, y);
  doc.text("To Date", margin + 150, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(formatDateValue(filters?.fromDate), margin, y + 12);
  doc.text(formatDateValue(filters?.toDate), margin + 150, y + 12);

  return y + 26;
}

function drawTableHeader(doc, y, margin, columns) {
  const totalWidth = columns.reduce((acc, column) => acc + column.width, 0);
  let x = margin;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, totalWidth, 20, 4, 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);

  columns.forEach((column) => {
    drawAlignedLines(doc, [column.label], x, y + 12, column.width, column.align, 8);
    x += column.width;
  });

  return y + 24;
}

function measureTradeRow(doc, trade, columns) {
  const lineHeight = 8.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);

  const cells = columns.map((column) => {
    const value = String(column.getValue(trade) || "-");
    const lines = column.wrap ? doc.splitTextToSize(value, column.width - 8) : [value];

    return {
      ...column,
      lines: lines.length ? lines : [value],
    };
  });

  const rowHeight = Math.max(18, ...cells.map((cell) => cell.lines.length * lineHeight + 8));
  return { cells, rowHeight, lineHeight };
}

function drawTradeRow(doc, trade, y, margin, columns) {
  const totalWidth = columns.reduce((acc, column) => acc + column.width, 0);
  const { cells, rowHeight, lineHeight } = measureTradeRow(doc, trade, columns);
  let x = margin;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.4);

  cells.forEach((cell) => {
    if (cell.key === "netPnL") {
      setPnLTextColor(doc, trade.netPnL);
    } else {
      doc.setTextColor(17, 24, 39);
    }

    drawAlignedLines(doc, cell.lines, x, y + 10, cell.width, cell.align, lineHeight);
    x += cell.width;
  });

  doc.setTextColor(17, 24, 39);

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + rowHeight, margin + totalWidth, y + rowHeight);

  return rowHeight + 2;
}

function drawSummary(doc, summary, y, margin, pageWidth) {
  const boxWidth = 196;
  const boxHeight = 80;
  const x = pageWidth - margin - boxWidth;
  const rows = [
    { label: "Total Trades", value: String(summary?.totalTrades || 0), amount: null, isBold: false },
    { label: "Brokerage", value: formatCurrencyValue(summary?.totalBrokerage), amount: null, isBold: false },
    { label: "Gross P&L", value: formatCurrencyValue(summary?.grossPnL), amount: summary?.grossPnL, isBold: false },
    { label: "Net P&L", value: formatCurrencyValue(summary?.netPnL), amount: summary?.netPnL, isBold: true },
  ];

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, boxWidth, boxHeight, 6, 6, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);

  rows.forEach((row, index) => {
    const rowY = y + 15 + index * 16;
    doc.text(row.label, x + 10, rowY);
    doc.setFont("helvetica", row.isBold ? "bold" : "normal");

    if (row.amount === null || row.amount === undefined) {
      doc.setTextColor(row.isBold ? 17 : 51, row.isBold ? 24 : 65, row.isBold ? 39 : 81);
    } else {
      setPnLTextColor(doc, row.amount);
    }

    doc.text(row.value, x + boxWidth - 10, rowY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
  });

  return boxHeight;
}

function drawFooter(doc, broker, trademarkImage, margin, pageWidth, pageHeight, generatedAt, pageNumber, totalPages) {
  const footerHeight = 82;
  const topY = pageHeight - margin - footerHeight;
  const markWidth = 116;
  const markHeight = 42;
  const gap = 18;
  const markX = pageWidth - margin - markWidth;
  const leftWidth = markX - margin - gap;
  const footerText =
    broker?.documents?.footerText || "This is a system-generated statement and does not require a signature.";
  const supportLine = buildSupportLine(broker);
  const generatedLine = `Generated on ${formatTimestampValue(generatedAt)} | Page ${pageNumber} of ${totalPages}`;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, topY, pageWidth - margin, topY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);

  let textY = topY + 13;
  [footerText, supportLine, generatedLine].forEach((line) => {
    const wrappedLines = doc.splitTextToSize(String(line), leftWidth);
    doc.text(wrappedLines, margin, textY);
    textY += wrappedLines.length * 8 + 3;
  });

  doc.setFontSize(8);
  doc.text(broker?.branding?.trademarkLabel || "Registered Mark", markX + markWidth, topY + 10, { align: "right" });

  if (trademarkImage) {
    drawImageContained(doc, trademarkImage, markX, topY + 16, markWidth, markHeight, { border: false, padding: 0 });
  } else {
    doc.setDrawColor(17, 24, 39);
    doc.line(markX + 16, topY + 54, markX + markWidth, topY + 54);
  }
}

export async function downloadBrokerInvoicePdf({ broker, client, trades, filters, summary, statementNumber }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24;
  const footerReserve = 94;
  const contentBottom = pageHeight - margin - footerReserve;
  const columns = getTableColumns();
  const invoiceTrades = trades || [];
  const generatedAt = new Date();

  const [logoImage, trademarkImage] = await Promise.all([
    urlToDataUrl(broker?.branding?.logoUrl),
    urlToDataUrl(broker?.branding?.trademarkUrl),
  ]);

  paintPage(doc);
  let y = drawHeader(doc, broker, client, statementNumber, filters, logoImage, margin, pageWidth);
  y = drawTableHeader(doc, y, margin, columns);

  invoiceTrades.forEach((trade) => {
    const { rowHeight } = measureTradeRow(doc, trade, columns);
    const requiredHeight = rowHeight + 2;

    if (y + requiredHeight > contentBottom) {
      doc.addPage();
      paintPage(doc);
      y = drawHeader(doc, broker, client, statementNumber, filters, logoImage, margin, pageWidth);
      y = drawTableHeader(doc, y, margin, columns);
    }

    y += drawTradeRow(doc, trade, y, margin, columns);
  });

  const summaryHeight = 96;
  if (y + 18 + summaryHeight > contentBottom) {
    doc.addPage();
    paintPage(doc);
    y = drawHeader(doc, broker, client, statementNumber, filters, logoImage, margin, pageWidth);
  }

  y += 14;
  drawSummary(doc, summary || { totalTrades: 0, totalBrokerage: 0, grossPnL: 0, netPnL: 0 }, y, margin, pageWidth);

  const totalPages = doc.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber);
    drawFooter(doc, broker, trademarkImage, margin, pageWidth, pageHeight, generatedAt, pageNumber, totalPages);
  }

  const safeName = `${client?.fullName || "client"}-${statementNumber || "statement"}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  doc.save(`${safeName}.pdf`);
}
