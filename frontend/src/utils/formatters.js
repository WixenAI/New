export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatAmount(value) {
  const amount = Number(value ?? 0);
  const normalizedAmount = Number.isNaN(amount) || Math.abs(amount) < 0.005 ? 0 : amount;

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizedAmount);
}

export function formatRupee(value) {
  const amount = Number(value ?? 0);
  const normalizedAmount = Number.isNaN(amount) || Math.abs(amount) < 0.005 ? 0 : amount;
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(normalizedAmount));

  return `${normalizedAmount < 0 ? "-" : ""}\u20B9${formattedAmount}`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function maskPhoneNumber(value) {
  const phone = String(value ?? "").trim();

  if (!phone) {
    return "-";
  }

  const digitCount = (phone.match(/\d/g) || []).length;
  if (digitCount <= 6) {
    return phone;
  }

  let digitIndex = 0;
  return phone.replace(/\d/g, (digit) => {
    digitIndex += 1;

    if (digitIndex <= 3 || digitIndex > digitCount - 3) {
      return digit;
    }

    return "X";
  });
}

export function initialsFromName(value) {
  if (!value) {
    return "BR";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function titleCase(value) {
  if (!value) {
    return "-";
  }

  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
