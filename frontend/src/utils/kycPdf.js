import { jsPDF } from "jspdf";
import { formatCurrency } from "./formatters";
import { resolveAssetUrl } from "./assets";

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
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function fitLines(doc, value, width, maxLines = 2) {
  const rawLines = doc.splitTextToSize(String(value || "-"), Math.max(width - 2, 24));

  if (rawLines.length <= maxLines) {
    return rawLines;
  }

  const lines = rawLines.slice(0, maxLines);
  const lastIndex = lines.length - 1;
  lines[lastIndex] = `${String(lines[lastIndex]).replace(/\.{0,3}$/, "")}...`;
  return lines;
}

function measureFieldHeight(doc, value, width, options = {}) {
  const maxLines = options.maxLines || 2;
  const lines = fitLines(doc, value, width - 10, maxLines);
  const lineHeight = options.lineHeight || 10;
  return Math.max(options.minHeight || 28, 14 + lines.length * lineHeight + 8);
}

function drawField(doc, { label, value, x, y, width, height, maxLines = 2 }) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(label, x, y);

  const lines = fitLines(doc, value, width, maxLines);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  doc.text(lines, x, y + 13, { maxWidth: width });

  doc.setDrawColor(203, 213, 225);
  doc.line(x, y + height, x + width, y + height);
}

function drawRow(doc, fields, x, y, totalWidth, gap = 14) {
  const ratioTotal = fields.reduce((sum, field) => sum + (field.ratio || 1), 0);
  const availableWidth = totalWidth - gap * (fields.length - 1);
  const widths = fields.map((field) => (availableWidth * (field.ratio || 1)) / ratioTotal);
  const heights = fields.map((field, index) =>
    measureFieldHeight(doc, field.value, widths[index], {
      maxLines: field.maxLines,
      minHeight: field.minHeight,
    })
  );
  const rowHeight = Math.max(...heights);

  let cursorX = x;
  fields.forEach((field, index) => {
    drawField(doc, {
      label: field.label,
      value: field.value,
      x: cursorX,
      y,
      width: widths[index],
      height: rowHeight,
      maxLines: field.maxLines,
    });
    cursorX += widths[index] + gap;
  });

  return rowHeight;
}

function drawSectionTitle(doc, title, x, y, width) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(title, x, y);
  doc.setDrawColor(203, 213, 225);
  doc.line(x, y + 8, x + width, y + 8);
}

function drawImageBox(doc, { image, label, x, y, width, height, border = true, padding = 6, placeholder = "Not uploaded" }) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(label, x, y);

  const frameY = y + 6;

  if (border) {
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, frameY, width, height, 6, 6);
  }

  if (!image) {
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(placeholder, x + width / 2, frameY + height / 2, { align: "center" });
    return frameY + height;
  }

  const props = doc.getImageProperties(image);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const scale = Math.min(innerWidth / props.width, innerHeight / props.height);
  const renderWidth = props.width * scale;
  const renderHeight = props.height * scale;
  const renderX = x + padding + (innerWidth - renderWidth) / 2;
  const renderY = frameY + padding + (innerHeight - renderHeight) / 2;

  doc.addImage(image, getImageFormat(image), renderX, renderY, renderWidth, renderHeight, undefined, "FAST");
  return frameY + height;
}

export async function downloadCustomerKycPdf({ broker, client }) {
  const kyc = client?.kyc || {};
  const fallbackName = splitName(client?.fullName);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 26;
  const contentWidth = pageWidth - margin * 2;

  const [logoImage, markImage, customerPhotoImage, customerSignatureImage, aadhaarFrontImage, aadhaarBackImage, panImage] = await Promise.all([
    urlToDataUrl(broker?.branding?.logoUrl),
    urlToDataUrl(broker?.branding?.trademarkUrl),
    urlToDataUrl(kyc.customerPhotoUrl),
    urlToDataUrl(kyc.customerSignatureUrl),
    urlToDataUrl(kyc.aadhaarFrontUrl),
    urlToDataUrl(kyc.aadhaarBackUrl),
    urlToDataUrl(kyc.panImageUrl),
  ]);

  paintPage(doc);

  let y = margin;

  if (logoImage) {
    doc.addImage(logoImage, getImageFormat(logoImage), margin, y, 42, 42, undefined, "FAST");
  } else {
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margin, y, 42, 42, 8, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text((broker?.branding?.logoText || "BR").slice(0, 2), margin + 21, y + 27, { align: "center" });
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(17, 24, 39);
  doc.text(broker?.branding?.brokerageHouseName || broker?.name || "Brokerage House", margin + 54, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text("KYC & Client Registration Form", margin + 54, y + 29);
  doc.text("Registered with Securities and Exchange Board of India (SEBI) as a Stock Broker", margin + 54, y + 42);

  y += 58;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  drawSectionTitle(doc, "Applicant Details", margin, y, contentWidth);
  y += 20;

  const photoWidth = 92;
  const photoHeight = 110;
  const photoGap = 16;
  const leftWidth = contentWidth - photoWidth - photoGap;
  const photoX = margin + leftWidth + photoGap;
  let leftY = y;

  leftY += drawRow(
    doc,
    [
      { label: "First Name", value: kyc.firstName || fallbackName.firstName },
      { label: "Last Name", value: kyc.lastName || fallbackName.lastName },
    ],
    margin,
    leftY,
    leftWidth
  ) + 8;

  leftY += drawRow(
    doc,
    [
      { label: "Father's Name", value: kyc.fatherName, ratio: 1.6 },
      { label: "Date of Birth", value: formatDateValue(kyc.dateOfBirth), ratio: 0.9 },
      { label: "Gender", value: kyc.gender ? kyc.gender.toUpperCase() : "-", ratio: 0.7 },
    ],
    margin,
    leftY,
    leftWidth
  ) + 8;

  leftY += drawRow(
    doc,
    [
      { label: "Mobile", value: client?.phone },
      { label: "Email", value: client?.email, ratio: 1.4 },
    ],
    margin,
    leftY,
    leftWidth
  ) + 8;

  leftY += drawRow(
    doc,
    [
      { label: "Application Date", value: formatDateValue(kyc.applicationDate), ratio: 1 },
      { label: "Initial Deposit (INR)", value: formatCurrency(kyc.initialDeposit || 0), ratio: 1.1 },
    ],
    margin,
    leftY,
    leftWidth
  ) + 8;

  leftY += drawRow(
    doc,
    [{ label: "Address", value: client?.address, maxLines: 3, minHeight: 36 }],
    margin,
    leftY,
    leftWidth
  );

  drawImageBox(doc, {
    image: customerPhotoImage,
    label: "Customer Photo",
    x: photoX,
    y,
    width: photoWidth,
    height: photoHeight,
    border: true,
    padding: 6,
  });

  y = Math.max(leftY, y + photoHeight + 6) + 18;

  drawSectionTitle(doc, "Identity Details", margin, y, contentWidth);
  y += 20;

  y += drawRow(
    doc,
    [
      { label: "Aadhaar Number", value: kyc.aadhaarNumber, ratio: 1.15 },
      { label: "PAN Number", value: kyc.panNumber, ratio: 0.95 },
    ],
    margin,
    y,
    contentWidth
  ) + 10;

  const docGap = 12;
  const docWidth = (contentWidth - docGap * 2) / 3;
  drawImageBox(doc, { image: aadhaarFrontImage, label: "Aadhaar Front", x: margin, y, width: docWidth, height: 84, border: true, padding: 6 });
  drawImageBox(doc, { image: aadhaarBackImage, label: "Aadhaar Back", x: margin + docWidth + docGap, y, width: docWidth, height: 84, border: true, padding: 6 });
  drawImageBox(doc, { image: panImage, label: "PAN Card", x: margin + (docWidth + docGap) * 2, y, width: docWidth, height: 84, border: true, padding: 6 });
  y += 102;

  drawSectionTitle(doc, "Declaration", margin, y, contentWidth);
  y += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  const declaration = doc.splitTextToSize(
    "I confirm that the information and supporting documents submitted in this KYC form are true and correct to the best of my knowledge.",
    contentWidth
  );
  doc.text(declaration, margin, y);
  y += declaration.length * 10 + 14;

  drawImageBox(doc, {
    image: customerSignatureImage,
    label: "Customer Signature",
    x: margin,
    y,
    width: 150,
    height: 52,
    border: true,
    padding: 6,
  });

  drawImageBox(doc, {
    image: markImage,
    label: "Registered Mark",
    x: margin + 190,
    y,
    width: 150,
    height: 52,
    border: false,
    padding: 0,
    placeholder: "",
  });

  y += 74;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const contactLine = `${broker?.contact?.phone || ""}${broker?.contact?.phone && broker?.contact?.email ? " | " : ""}${broker?.contact?.email || ""}`.trim();
  if (contactLine) {
    doc.text(contactLine, margin, y);
  }

  const safeName = `${kyc.firstName || client?.fullName || "customer"}-${client?.idCode || "KYC"}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");

  doc.save(`${safeName}-kyc-form.pdf`);
}
