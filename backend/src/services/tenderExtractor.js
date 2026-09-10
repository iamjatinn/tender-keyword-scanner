function cleanText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSpaces(value) {
  if (!value) {
    return "Not Found";
  }

  return value
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function cleanExtractedValue(value) {
  if (!value) {
    return "Not Found";
  }

  const cleaned = normalizeSpaces(value);

  if (!cleaned || /^[,.\-:;]+$/.test(cleaned)) {
    return "Not Found";
  }

  return cleaned;
}

function extractField(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      const value = cleanExtractedValue(match[1]);

      if (value !== "Not Found") {
        return value;
      }
    }
  }

  return "Not Found";
}

/*
 * Generic section extraction.
 *
 * Finds a heading and captures everything until
 * one of the next section headings.
 */
function extractSection(text, startPatterns, endPatterns) {
  for (const startPattern of startPatterns) {
    const startMatch = text.match(startPattern);

    if (!startMatch) {
      continue;
    }

    const startIndex = startMatch.index + startMatch[0].length;

    const remainingText = text.slice(startIndex);

    let endIndex = remainingText.length;

    for (const endPattern of endPatterns) {
      const endMatch = remainingText.match(endPattern);

      if (
        endMatch &&
        typeof endMatch.index === "number" &&
        endMatch.index < endIndex
      ) {
        endIndex = endMatch.index;
      }
    }

    const section = remainingText.slice(0, endIndex).trim();

    if (section) {
      return normalizeSpaces(section);
    }
  }

  return "Not Found";
}

/*
 * Generic list of Indian States / Union Territories.
 *
 * This is reference data, not a list of tender-specific
 * locations.
 */
const indianStatesAndUTs = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

function findIndianState(value) {
  if (!value || value === "Not Found") {
    return "Not Found";
  }

  const normalized = value.trim().toLowerCase();

  const state = indianStatesAndUTs.find(
    (item) => item.toLowerCase() === normalized,
  );

  return state || "Not Found";
}

/*
 * Location extraction.
 *
 * IMPORTANT:
 * We only return a location when the document
 * explicitly identifies it.
 *
 * We do NOT guess a city from random address text.
 */
function extractLocation(text) {
  // 1. Explicit State/UT
  const stateValue = extractField(text, [
    /Ministry\/State Name\s+([^\n]+)/i,
    /Ministry\s*\/\s*State Name\s*[:\-]\s*([^\n]+)/i,
    /State Name\s*[:\-]\s*([^\n]+)/i,
    /\bState\s*[:\-]\s*([^\n]+)/i,
  ]);

  const state = findIndianState(stateValue);

  if (state !== "Not Found") {
    return state;
  }

  // 2. Explicit location fields
  const explicitLocation = extractField(text, [
    /Tender Location\s*[:\-]\s*([^\n]+)/i,
    /Location of Supply\s*[:\-]\s*([^\n]+)/i,
    /Place of Supply\s*[:\-]\s*([^\n]+)/i,
    /Place of Delivery\s*[:\-]\s*([^\n]+)/i,
    /Delivery Location\s*[:\-]\s*([^\n]+)/i,
    /Work Location\s*[:\-]\s*([^\n]+)/i,
    /Project Location\s*[:\-]\s*([^\n]+)/i,
  ]);

  if (explicitLocation !== "Not Found") {
    return explicitLocation;
  }

  /*
   * No reliable explicit location found.
   *
   * Do not guess.
   */
  return "Not Found";
}

/*
 * Extract consignee address.
 *
 * This is deliberately based on the structure of
 * the Consignee section instead of guessing from
 * arbitrary PIN-code occurrences.
 */
function extractConsigneeAddress(text) {
  const consigneeIndex = text.search(/Consignees?\/?Reporting|Consignee/i);

  if (consigneeIndex === -1) {
    return "Not Found";
  }

  const section = text.slice(consigneeIndex, consigneeIndex + 2500);

  /*
   * Find a 6-digit Indian PIN code.
   */
  const pinMatch = section.match(/\b(\d{6})\s*,?\s*/);

  if (!pinMatch) {
    return "Not Found";
  }

  const pin = pinMatch[1];

  const addressStart = pinMatch.index + pinMatch[0].length;

  let address = section.slice(addressStart);

  /*
   * Remove the quantity/delivery columns when they
   * appear after the address.
   *
   * Example:
   *
   * Address text
   * 1 120
   */
  address = address.replace(/\s+\d+\s+\d+\b[\s\S]*$/i, "");

  /*
   * Stop if another major section begins.
   */
  address = address.split(
    /\n(?:Buyer Added|Generic|Delivery Requirement|Guarantee Clause|Inspection Agency|Buyer Added Bid)/i,
  )[0];

  address = cleanExtractedValue(`${pin}, ${address}`);

  if (address === "Not Found") {
    return "Not Found";
  }

  return address;
}

/*
 * Tender ID
 */
function extractTenderId(text) {
  return extractField(text, [
    /Bid Number\s*[:\-]?\s*([A-Z0-9\/._\-]+)/i,
    /Tender Number\s*[:\-]?\s*([A-Z0-9\/._\-]+)/i,
    /Tender No\.?\s*[:\-]?\s*([A-Z0-9\/._\-]+)/i,
    /Tender ID\s*[:\-]?\s*([A-Z0-9\/._\-]+)/i,
    /Bid ID\s*[:\-]?\s*([A-Z0-9\/._\-]+)/i,
  ]);
}

/*
 * Tender Authority
 */
function extractTenderAuthority(text) {
  return extractField(text, [
    /Organisation Name\s+([^\n]+)/i,
    /Organisation Name\s*[:\-]\s*([^\n]+)/i,
    /Organization Name\s+([^\n]+)/i,
    /Organization Name\s*[:\-]\s*([^\n]+)/i,
    /Tendering Authority\s*[:\-]\s*([^\n]+)/i,
    /Tender Authority\s*[:\-]\s*([^\n]+)/i,
    /Procuring Entity\s*[:\-]\s*([^\n]+)/i,
  ]);
}

/*
 * Opening Date
 */
function extractOpeningDate(text) {
  return extractField(text, [
    /Bid Opening\s+Date\/Time\s+([^\n]+)/i,
    /Bid Opening Date\/Time\s*[:\-]\s*([^\n]+)/i,
    /Opening Date\/Time\s*[:\-]\s*([^\n]+)/i,
    /Bid Opening Date\s*[:\-]\s*([^\n]+)/i,
  ]);
}

/*
 * Closing Date
 */
function extractClosingDate(text) {
  return extractField(text, [
    /Bid End Date\/Time\s+([^\n]+)/i,
    /Bid End Date\s*\/\s*Time\s+([^\n]+)/i,
    /Bid End Date\/Time\s*[:\-]\s*([^\n]+)/i,
    /Closing Date\/Time\s*[:\-]\s*([^\n]+)/i,
    /Closing Date\s*[:\-]\s*([^\n]+)/i,
  ]);
}

/*
 * Tender Amount
 */
function extractTenderAmount(text) {
  return extractField(text, [
    /Estimated Bid Value\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /Estimated Tender Value\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /Tender Value\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /Tender Amount\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /Contract Value\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
  ]);
}

/*
 * EMD
 */
function extractEmd(text) {
  return extractField(text, [
    /EMD Detail[\s\S]{0,200}?Required\s+([A-Za-z]+)/i,
    /EMD\s+Required\s*[:\-]?\s*([A-Za-z]+)/i,
    /Earnest Money Deposit\s+Required\s*[:\-]?\s*([A-Za-z]+)/i,
  ]);
}

/*
 * Document Cost
 */
function extractDocumentCost(text) {
  return extractField(text, [
    /Document Cost\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /Cost of Tender Document\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
  ]);
}

/*
 * Tender Fee
 */
function extractTenderFee(text) {
  return extractField(text, [
    /Tender Fee\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /Tender Fees\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
    /Bid Participation Fee\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i,
  ]);
}

/*
 * Item / Product category
 */
function extractTabName(text) {
  const value = extractField(text, [
    /Item Category\s+([^\n]+)/i,
    /Primary product category\s+([^\n]+)/i,
    /Primary Product Category\s*[:\-]\s*([^\n]+)/i,
    /Product Category\s*[:\-]\s*([^\n]+)/i,
    /Item Description\s*[:\-]\s*([^\n]+)/i,
    /Product Description\s*[:\-]\s*([^\n]+)/i,
  ]);

  if (value === "Not Found") {
    return "Not Found";
  }

  return value.replace(/\s*,\s*$/, "").trim();
}

/*
 * Scope
 */
function extractScopeOfWork(text) {
  return extractField(text, [
    /Scope of supply\s*\(Bid price to include all cost components\)\s*:\s*([^\n]+)/i,
    /Scope of Supply\s*[:\-]\s*([^\n]+)/i,
    /Scope of Work\s*[:\-]\s*([^\n]+)/i,
    /Nature of Work\s*[:\-]\s*([^\n]+)/i,
    /Work Description\s*[:\-]\s*([^\n]+)/i,
  ]);
}

/*
 * Technical Qualification
 */
function extractTechnicalQualification(text) {
  return extractSection(
    text,
    [
      /ELIGIBILITY CRITERIA\s*->/i,
      /TECHNICAL QUALIFICATION\s*[:\-]?/i,
      /TECHNICAL ELIGIBILITY\s*[:\-]?/i,
      /TECHNICAL CRITERIA\s*[:\-]?/i,
    ],
    [
      /\n[A-Z][A-Z ]{4,}->/i,
      /DELIVERY REQUIREMENT\s*->/i,
      /GUARANTEE CLAUSE\s*->/i,
      /FINANCIAL QUALIFICATION\s*[:\-]?/i,
      /FINANCIAL CRITERIA\s*[:\-]?/i,
    ],
  );
}

/*
 * Financial Qualification
 */
function extractFinancialQualification(text) {
  return extractSection(
    text,
    [
      /FINANCIAL QUALIFICATION\s*[:\-]?/i,
      /FINANCIAL ELIGIBILITY\s*[:\-]?/i,
      /FINANCIAL CRITERIA\s*[:\-]?/i,
      /FINANCIAL DOCUMENT REQUIRED\s+/i,
    ],
    [
      /\n[A-Z][A-Z ]{4,}->/i,
      /DELIVERY REQUIREMENT\s*->/i,
      /GUARANTEE CLAUSE\s*->/i,
      /TECHNICAL QUALIFICATION\s*[:\-]?/i,
    ],
  );
}

/*
 * Tender Description
 */
function extractTenderDescription(text, tabName) {
  if (tabName !== "Not Found") {
    return tabName;
  }

  return extractField(text, [
    /Tender Description\s*[:\-]\s*([^\n]+)/i,
    /Description of Work\s*[:\-]\s*([^\n]+)/i,
    /Description\s*[:\-]\s*([^\n]+)/i,
  ]);
}

/*
 * Corrigendum
 *
 * Do NOT treat "Corrigendum if any" as an
 * actual corrigendum.
 */
function extractCorrigendum(text) {
  const patterns = [
    /CORRIGENDUM DETAILS\s*[:\-]\s*/i,
    /CORRIGENDUM\s+NO\.?\s*[:\-]?\s*/i,
    /CORRIGENDUM\s+DATE\s*[:\-]?\s*/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) {
      continue;
    }

    const startIndex = match.index + match[0].length;

    const remaining = text.slice(startIndex);

    const endMatch = remaining.match(
      /\n(?:DISCLAIMER|IMPORTANT|GENERAL TERMS|TERMS AND CONDITIONS)\b/i,
    );

    const section = remaining.slice(0, endMatch ? endMatch.index : 500);

    const value = cleanExtractedValue(section);

    if (value !== "Not Found") {
      return value;
    }
  }

  return "Not Found";
}

/*
 * Email
 */
function extractEmail(text) {
  const match = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);

  return match ? match[0].trim() : "Not Found";
}

/*
 * Website
 */
function extractWebsite(text) {
  const match = text.match(/\b(?:https?:\/\/|www\.)[^\s<>"']+/i);

  return match ? match[0].replace(/[.,;)]+$/, "") : "Not Found";
}

/*
 * Main metadata extraction
 */
function extractTenderMetadata(text) {
  const clean = cleanText(text);

  const tenderId = extractTenderId(clean);

  const tenderAuthority = extractTenderAuthority(clean);

  const location = extractLocation(clean);

  const openingDate = extractOpeningDate(clean);

  const closingDate = extractClosingDate(clean);

  const tenderAmount = extractTenderAmount(clean);

  const emd = extractEmd(clean);

  const documentCost = extractDocumentCost(clean);

  const tenderFee = extractTenderFee(clean);

  const tabName = extractTabName(clean);

  const technicalQualification = extractTechnicalQualification(clean);

  const financialQualification = extractFinancialQualification(clean);

  const scopeOfWork = extractScopeOfWork(clean);

  const tenderDescription = extractTenderDescription(clean, tabName);

  let tenderSummary = "Not Found";

  if (tabName !== "Not Found" && scopeOfWork !== "Not Found") {
    tenderSummary = `${tabName} - ${scopeOfWork}`;
  } else if (tabName !== "Not Found") {
    tenderSummary = tabName;
  } else if (tenderDescription !== "Not Found") {
    tenderSummary = tenderDescription;
  }

  const purchaserAddress = extractConsigneeAddress(clean);

  const email = extractEmail(clean);

  const website = extractWebsite(clean);

  const corrigendum = extractCorrigendum(clean);

  return {
    tenderId,
    tenderNo: tenderId,
    tenderAuthority,
    location,
    openingDate,
    closingDate,
    tenderAmount,
    emd,
    documentCost,
    tenderFee,
    tabName,
    technicalQualification,
    financialQualification,
    scopeOfWork,
    tenderSummary,
    tenderDescription,
    corrigendum,
    purchaserAddress,
    email,
    website,
  };
}

module.exports = {
  extractTenderMetadata,
};
