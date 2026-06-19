function escapePdfText(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London"
  }).format(date);
}

function formatMoney(value, currency = "GBP") {
  return `${currency} ${(Number(value) || 0).toFixed(2)}`;
}

function wrapText(value, maxChars = 56) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function buildPdf(commands) {
  const content = commands.join("\n");
  const contentLength = Buffer.byteLength(content, "utf8");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function text(commands, value, x, y, size = 10, font = "F1", color = "0.15 0.12 0.10") {
  commands.push(`${color} rg`);
  commands.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`);
}

function line(commands, x1, y1, x2, y2, width = 0.75, color = "0.86 0.75 0.44") {
  commands.push(`${color} RG`);
  commands.push(`${width} w`);
  commands.push(`${x1} ${y1} m ${x2} ${y2} l S`);
}

function rect(commands, x, y, width, height, color = "0.98 0.95 0.91") {
  commands.push(`${color} rg`);
  commands.push(`${x} ${y} ${width} ${height} re f`);
}

function multiline(commands, value, x, y, options = {}) {
  const { size = 10, font = "F1", maxChars = 54, lineHeight = 14, color = "0.31 0.27 0.25", maxLines = 5 } = options;
  const lines = wrapText(value, maxChars).slice(0, maxLines);

  lines.forEach((lineValue, index) => {
    text(commands, lineValue, x, y - index * lineHeight, size, font, color);
  });

  return y - lines.length * lineHeight;
}

export function generateInvoicePdf(invoice) {
  const commands = [];
  const currency = invoice.currency || "GBP";
  let y = 790;

  rect(commands, 0, 760, 595.28, 81.89, "0.09 0.07 0.06");
  text(commands, "VELURA SERVICES", 48, 804, 22, "F2", "1 1 1");
  text(commands, "Luxury cleaning, gently delivered.", 48, 784, 11, "F1", "0.87 0.75 0.44");
  text(commands, "INVOICE", 458, 804, 24, "F2", "1 1 1");
  text(commands, invoice.invoiceNumber, 458, 784, 12, "F2", "0.87 0.75 0.44");

  y = 720;
  text(commands, "Bill to", 48, y, 11, "F2", "0.56 0.42 0.32");
  text(commands, invoice.clientName, 48, y - 18, 14, "F2");
  let leftY = multiline(commands, invoice.billingAddress, 48, y - 36, { maxChars: 36, maxLines: 4 });
  if (invoice.email) {
    text(commands, invoice.email, 48, leftY - 4, 10, "F1", "0.31 0.27 0.25");
    leftY -= 16;
  }
  if (invoice.phone) {
    text(commands, invoice.phone, 48, leftY - 4, 10, "F1", "0.31 0.27 0.25");
  }

  const detailX = 360;
  text(commands, "Issue date", detailX, y, 10, "F2", "0.56 0.42 0.32");
  text(commands, formatDate(invoice.issueDate), detailX + 98, y, 10, "F1");
  text(commands, "Due date", detailX, y - 18, 10, "F2", "0.56 0.42 0.32");
  text(commands, formatDate(invoice.dueDate), detailX + 98, y - 18, 10, "F1");
  text(commands, "Booking ref", detailX, y - 36, 10, "F2", "0.56 0.42 0.32");
  text(commands, invoice.bookingReference || "N/A", detailX + 98, y - 36, 10, "F1");
  text(commands, "Status", detailX, y - 54, 10, "F2", "0.56 0.42 0.32");
  text(commands, String(invoice.status || "draft").toUpperCase(), detailX + 98, y - 54, 10, "F2");

  y = 575;
  rect(commands, 48, y, 499, 26, "0.96 0.92 0.85");
  text(commands, "Description", 60, y + 8, 9, "F2", "0.36 0.25 0.17");
  text(commands, "Qty", 318, y + 8, 9, "F2", "0.36 0.25 0.17");
  text(commands, "Unit", 358, y + 8, 9, "F2", "0.36 0.25 0.17");
  text(commands, "VAT", 430, y + 8, 9, "F2", "0.36 0.25 0.17");
  text(commands, "Total", 488, y + 8, 9, "F2", "0.36 0.25 0.17");
  y -= 24;

  for (const item of invoice.lineItems || []) {
    const startY = y;
    const descY = multiline(commands, item.description, 60, y, { maxChars: 46, maxLines: 3, lineHeight: 12 });
    text(commands, Number(item.quantity || 0).toFixed(2), 318, y, 9);
    text(commands, formatMoney(item.unitPrice, currency), 358, y, 9);
    text(commands, `${Number(item.vatRate || 0).toFixed(0)}%`, 430, y, 9);
    text(commands, formatMoney(item.total, currency), 488, y, 9, "F2");
    y = Math.min(descY - 10, startY - 34);
    line(commands, 48, y + 7, 547, y + 7, 0.4, "0.90 0.86 0.80");

    if (y < 250) {
      break;
    }
  }

  y = Math.min(y - 12, 390);
  const totalsX = 365;
  text(commands, "Subtotal", totalsX, y, 10, "F2", "0.31 0.27 0.25");
  text(commands, formatMoney(invoice.subtotal, currency), 488, y, 10, "F1");
  text(commands, "VAT", totalsX, y - 20, 10, "F2", "0.31 0.27 0.25");
  text(commands, formatMoney(invoice.vatTotal, currency), 488, y - 20, 10, "F1");
  rect(commands, totalsX - 12, y - 58, 182, 29, "0.09 0.07 0.06");
  text(commands, "Total due", totalsX, y - 48, 11, "F2", "1 1 1");
  text(commands, formatMoney(invoice.total, currency), 488, y - 48, 11, "F2", "1 1 1");

  y = 185;
  text(commands, "Payment", 48, y, 11, "F2", "0.56 0.42 0.32");
  multiline(
    commands,
    invoice.paymentInstructions ||
      "Please pay by bank transfer to the Velura Services Tide account. Use the invoice number as the payment reference.",
    48,
    y - 18,
    { maxChars: 76, maxLines: 4, lineHeight: 13 }
  );

  if (invoice.notes) {
    text(commands, "Notes", 48, 98, 11, "F2", "0.56 0.42 0.32");
    multiline(commands, invoice.notes, 48, 80, { maxChars: 76, maxLines: 3, lineHeight: 13 });
  }

  line(commands, 48, 42, 547, 42, 0.5, "0.86 0.75 0.44");
  text(commands, "Velura Services LTD | bookings@veluraservices.com | www.veluraservices.com", 48, 24, 9, "F1", "0.43 0.38 0.34");

  return buildPdf(commands);
}
