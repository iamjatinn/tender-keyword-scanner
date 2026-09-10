const GEMINI_MODEL = "gemini-2.5-flash";

const metadataSchema = {
  type: "object",
  properties: {
    tenderId: {
      type: "string",
      description:
        "Explicit Tender ID or Bid ID. Never use Tender No as Tender ID.",
    },

    tenderNo: {
      type: "string",
      description:
        "Explicit Tender No, Tender Number, Tender Reference, Enquiry No, or Bid Number.",
    },

    tenderAuthority: {
      type: "string",
      description:
        "Organization or authority explicitly issuing or inviting the tender.",
    },

    location: {
      type: "string",
      description:
        "Explicit work, project, tender, delivery, execution, or site location.",
    },

    openingDate: {
      type: "string",
      description: "Explicit tender/bid opening date and time.",
    },

    closingDate: {
      type: "string",
      description: "Current/latest tender submission closing date and time.",
    },

    tenderAmount: {
      type: "string",
      description: "Explicit estimated tender/bid/contract value.",
    },

    emd: {
      type: "string",
      description:
        "EMD status or amount, using revised amount if explicitly amended.",
    },

    documentCost: {
      type: "string",
      description:
        "Explicit document cost. Preserve Not Applicable when explicitly stated.",
    },

    tenderFee: {
      type: "string",
      description: "Explicit tender/bid participation fee.",
    },

    tabName: {
      type: "string",
      description:
        "Explicit Item Category, Product Category, Item Name, Product Name, or Tab Name. Never derive it from tender title.",
    },

    technicalQualification: {
      type: "string",
      description: "Technical eligibility/qualification requirements only.",
    },

    financialQualification: {
      type: "string",
      description: "Financial eligibility/qualification requirements only.",
    },

    scopeOfWork: {
      type: "string",
      description: "Actual scope of supply/work/service.",
    },

    tenderSummary: {
      type: "string",
      description: "Short factual summary of what the tender is for.",
    },

    tenderDescription: {
      type: "string",
      description: "Explicit product/item/service/tender description.",
    },

    corrigendum: {
      type: "string",
      description: "Actual corrigendum/amendment information only.",
    },

    purchaserAddress: {
      type: "string",
      description: "Explicit purchaser/buyer/consignee/office address.",
    },

    email: {
      type: "string",
      description: "Most relevant official tender contact email.",
    },

    website: {
      type: "string",
      description: "Explicit official website.",
    },
  },

  required: [
    "tenderId",
    "tenderNo",
    "tenderAuthority",
    "location",
    "openingDate",
    "closingDate",
    "tenderAmount",
    "emd",
    "documentCost",
    "tenderFee",
    "tabName",
    "technicalQualification",
    "financialQualification",
    "scopeOfWork",
    "tenderSummary",
    "tenderDescription",
    "corrigendum",
    "purchaserAddress",
    "email",
    "website",
  ],
};

/* =========================================================
   BASIC HELPERS
========================================================= */

function getMissingFields(metadata) {
  return Object.entries(metadata)
    .filter(([_, value]) => {
      return (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "Not Found"
      );
    })
    .map(([key]) => key);
}

function normalizeText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, " ")
    .replace(/\u00a0/g, " ");
}

function cleanSingleLine(value) {
  if (!value) {
    return "Not Found";
  }

  return String(value)
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/-{5,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanSection(value) {
  if (!value) {
    return "Not Found";
  }

  return String(value)
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/-{5,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   TENDER ID
========================================================= */

function extractExplicitTenderId(text) {
  const patterns = [
    /\bTender\s*ID\s*(?:No\.?|Number)?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,

    /\bTenderID\s*(?:No\.?|Number)?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,

    /\bBid\s*ID\s*(?:No\.?|Number)?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,

    /\bBidID\s*(?:No\.?|Number)?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return cleanSingleLine(match[1]);
    }
  }

  return "Not Found";
}

/* =========================================================
   TENDER NUMBER
========================================================= */

function extractExplicitTenderNo(text) {
  const patterns = [
    /\bTender\s*(?:No\.?|Number)\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,

    /\bTender\s*Reference\s*(?:No\.?|Number)?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,

    /\bTender\s*Ref\.?\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,

    /\bEnquiry\s*(?:No\.?|Number)\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,

    /\bBid\s*(?:No\.?|Number)\s*[:\-]\s*([A-Za-z0-9][A-Za-z0-9./_-]*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return cleanSingleLine(match[1]);
    }
  }

  return "Not Found";
}

/* =========================================================
   DATE HELPERS
========================================================= */

const DATE_PATTERN = String.raw`[0-9]{1,2}[\/.-][0-9]{1,2}[\/.-][0-9]{2,4}(?:\s+[0-9]{1,2}:[0-9]{2}(?:\s*(?:AM|PM|Hrs?|Hours?))?)?`;

function extractDateAfterLabels(text, labels) {
  const labelPattern = labels.join("|");

  const pattern = new RegExp(
    `(?:${labelPattern})\\s*[:\\-]?\\s*(${DATE_PATTERN})`,
    "i",
  );

  const match = text.match(pattern);

  if (!match || !match[1]) {
    return "Not Found";
  }

  return cleanSingleLine(match[1]);
}

/* =========================================================
   OPENING DATE
========================================================= */

function extractExplicitOpeningDate(text) {
  const normalized = normalizeText(text);

  return extractDateAfterLabels(normalized, [
    "Technical Bid Opening Date/Time",
    "Technical Bid Opening Date",
    "Technical Bid Opening",
    "Bid Opening Date/Time",
    "Bid Opening Date",
    "Tender Opening Date/Time",
    "Tender Opening Date",
    "Opening Date/Time",
    "Opening Date",
    "Bid Opening",
  ]);
}

/* =========================================================
   NORMAL CLOSING DATE
========================================================= */

function extractExplicitClosingDate(text) {
  const normalized = normalizeText(text);

  return extractDateAfterLabels(normalized, [
    "Last Date for Submission",
    "Last Date of Submission",
    "Last Date for Receipt",
    "Last Date of Receipt",
    "Last Date for Bid Submission",
    "Last Date of Bid Submission",
    "Bid Submission End Date",
    "Bid Submission Closing Date",
    "Closing Date/Time",
    "Closing Date",
    "Submission End Date",
    "Tender Closing Date",
  ]);
}

/* =========================================================
   REVISED CLOSING DATE
========================================================= */

function extractRevisedClosingDate(text) {
  const normalized = normalizeText(text);

  const patterns = [
    new RegExp(
      `Revised\\s+closing\\s+date\\s*[:\\-]?\\s*(${DATE_PATTERN})`,
      "i",
    ),

    new RegExp(
      `Revised\\s+last\\s+date(?:\\s+of\\s+submission)?\\s*[:\\-]?\\s*(${DATE_PATTERN})`,
      "i",
    ),

    new RegExp(
      `Extended\\s+closing\\s+date\\s*[:\\-]?\\s*(${DATE_PATTERN})`,
      "i",
    ),

    new RegExp(
      `Extended\\s+last\\s+date(?:\\s+of\\s+submission)?\\s*[:\\-]?\\s*(${DATE_PATTERN})`,
      "i",
    ),

    new RegExp(
      `closing\\s+date\\s+(?:is\\s+)?(?:extended|revised)\\s+to\\s+(${DATE_PATTERN})`,
      "i",
    ),

    new RegExp(
      `last\\s+date(?:\\s+of\\s+submission)?\\s+(?:is\\s+)?(?:extended|revised)\\s+to\\s+(${DATE_PATTERN})`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match && match[1]) {
      return cleanSingleLine(match[1]);
    }
  }

  return "Not Found";
}

/* =========================================================
   MONEY
========================================================= */

function normalizeMoneyValue(value) {
  if (!value || typeof value !== "string") {
    return value;
  }

  let result = value.trim();

  result = result.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, " ");

  result = result.replace(/\\/g, "");

  /*
   * 12, 50, 000
   * becomes
   * 12,50,000
   */

  result = result.replace(/(\d)\s*,\s*(?=\d)/g, "$1,");

  result = result.replace(/\s+/g, " ");

  return result.trim();
}

function extractExplicitMoney(text, labels) {
  const labelPattern = labels.join("|");

  const currencyPattern = String.raw`(?:Rs\.?|INR|₹)\s*[0-9][0-9,\s]*(?:\/-)?`;

  const pattern = new RegExp(
    `(?:${labelPattern})\\s*[:\\-]?\\s*(${currencyPattern})`,
    "i",
  );

  const match = text.match(pattern);

  if (!match || !match[1]) {
    return "Not Found";
  }

  return normalizeMoneyValue(match[1]);
}

/* =========================================================
   REVISED EMD
========================================================= */

function extractRevisedEmd(text) {
  const normalized = normalizeText(text);

  const currencyPattern = String.raw`(?:Rs\.?|INR|₹)\s*[0-9][0-9,\s]*(?:\/-)?`;

  const patterns = [
    new RegExp(`Revised\\s+EMD\\s*[:\\-]?\\s*(${currencyPattern})`, "i"),

    new RegExp(
      `Revised\\s+Earnest\\s+Money\\s+Deposit\\s*[:\\-]?\\s*(${currencyPattern})`,
      "i",
    ),

    new RegExp(
      `EMD\\s+(?:is\\s+)?revised\\s+from\\s+${currencyPattern}\\s+to\\s+(${currencyPattern})`,
      "i",
    ),

    new RegExp(
      `Earnest\\s+Money\\s+Deposit\\s+(?:is\\s+)?revised\\s+from\\s+${currencyPattern}\\s+to\\s+(${currencyPattern})`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match && match[1]) {
      return normalizeMoneyValue(match[1]);
    }
  }

  return "Not Found";
}

/* =========================================================
   EMD
========================================================= */

function extractExplicitEmd(text) {
  return extractExplicitMoney(text, [
    "EMD Amount",
    "EMD",
    "Earnest Money Deposit",
  ]);
}

/* =========================================================
   DOCUMENT COST
========================================================= */

function extractExplicitDocumentCost(text) {
  const normalized = normalizeText(text);

  /*
   * Handle explicit non-monetary values.
   *
   * Example:
   * Document Cost: Not Applicable
   */

  const statusPattern =
    /\bDocument\s+Cost\s*[:\-]\s*(Not\s+Applicable|N\/A|NA|Nil|None|Free)\b/i;

  const statusMatch = normalized.match(statusPattern);

  if (statusMatch && statusMatch[1]) {
    return cleanSingleLine(statusMatch[1]);
  }

  /*
   * Otherwise try extracting an actual monetary amount.
   */

  return extractExplicitMoney(normalized, ["Document Cost"]);
}

/* =========================================================
   TAB / ITEM CATEGORY
========================================================= */

function extractExplicitTabName(text) {
  const patterns = [
    /\bItem\s*Category\s*[:\-]\s*([^\r\n]+)/i,

    /\bPrimary\s+Product\s+Category\s*[:\-]\s*([^\r\n]+)/i,

    /\bProduct\s+Category\s*[:\-]\s*([^\r\n]+)/i,

    /\bTab\s*Name\s*[:\-]\s*([^\r\n]+)/i,

    /\bItem\s*Name\s*[:\-]\s*([^\r\n]+)/i,

    /\bProduct\s*Name\s*[:\-]\s*([^\r\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      const value = cleanSingleLine(match[1]);

      if (value !== "Not Found") {
        return value;
      }
    }
  }

  return "Not Found";
}

/* =========================================================
   TENDER AUTHORITY
========================================================= */

function extractExplicitTenderAuthority(text) {
  const patterns = [
    /\bTender\s+Inviting\s+Authority\s*[:\-]\s*([^\r\n]+)/i,

    /\bTender\s+Authority\s*[:\-]\s*([^\r\n]+)/i,

    /\bIssuing\s+Authority\s*[:\-]\s*([^\r\n]+)/i,

    /\bTender\s+Invited\s+By\s*[:\-]\s*([^\r\n]+)/i,

    /\bOrganization\s*[:\-]\s*([^\r\n]+)/i,

    /\bOrganisation\s*[:\-]\s*([^\r\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return cleanSingleLine(match[1]);
    }
  }

  return "Not Found";
}

/* =========================================================
   PURCHASER ADDRESS
========================================================= */

function extractPurchaserAddress(text) {
  const patterns = [
    /\bPurchaser\s+Address\s*[:\-]\s*([\s\S]{1,300}?)(?=\n\s*(?:Email|Website|Contact|Tender|Scope|Technical|Financial|$))/i,

    /\bBuyer\s+Address\s*[:\-]\s*([\s\S]{1,300}?)(?=\n\s*(?:Email|Website|Contact|Tender|Scope|Technical|Financial|$))/i,

    /\bRegistered\s+Office\s*[:\-]\s*([\s\S]{1,300}?)(?=\n\s*(?:Work Location|Email|Website|Contact|Tender|Scope|$))/i,

    /\bOffice\s+Address\s*[:\-]\s*([\s\S]{1,300}?)(?=\n\s*(?:Email|Website|Contact|Tender|Scope|$))/i,

    /\bConsignee\s+Address\s*[:\-]\s*([\s\S]{1,300}?)(?=\n\s*(?:Email|Website|Contact|Tender|Scope|$))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return cleanSection(match[1]);
    }
  }

  return "Not Found";
}

/* =========================================================
   EMAIL
========================================================= */

function normalizeEmail(value) {
  if (!value) {
    return "Not Found";
  }

  return value
    .replace(/\\@/g, "@")
    .replace(/\\\./g, ".")
    .replace(/\\/g, "")
    .trim();
}

function extractTenderContactEmail(text) {
  const emailPattern = String.raw`([A-Z0-9._%+-]+\\?@[A-Z0-9.-]+\\?\.[A-Z]{2,})`;

  /*
   * 1. Buyer Email
   */

  const buyerPatterns = [
    new RegExp(
      `\\bBuyer\\s+Email\\s*(?:id|ID)?\\s*[:\\-]?\\s*${emailPattern}`,
      "i",
    ),

    new RegExp(`\\bBuyer\\s+Email\\s*(?:id|ID)?\\s+${emailPattern}`, "i"),
  ];

  for (const pattern of buyerPatterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return normalizeEmail(match[1]);
    }
  }

  /*
   * 2. Explicit tender contact
   */

  const contactPatterns = [
    new RegExp(
      `\\bTender\\s+Contact\\s+Email\\s*[:\\-]\\s*${emailPattern}`,
      "i",
    ),

    new RegExp(`\\bTender\\s+Email\\s*[:\\-]\\s*${emailPattern}`, "i"),
  ];

  for (const pattern of contactPatterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return normalizeEmail(match[1]);
    }
  }

  /*
   * 3. Tender/commercial queries
   */

  const commercialPattern = new RegExp(
    `For\\s+tender\\/commercial\\s+queries[\\s\\S]{0,250}?Email\\s*[:\\-]\\s*${emailPattern}`,
    "i",
  );

  const commercialMatch = text.match(commercialPattern);

  if (commercialMatch && commercialMatch[1]) {
    return normalizeEmail(commercialMatch[1]);
  }

  /*
   * 4. Tender queries / clarification
   */

  const tenderQueriesPattern = new RegExp(
    `For\\s+tender\\s+(?:queries|clarification)[\\s\\S]{0,250}?Email\\s*[:\\-]\\s*${emailPattern}`,
    "i",
  );

  const tenderQueriesMatch = text.match(tenderQueriesPattern);

  if (tenderQueriesMatch && tenderQueriesMatch[1]) {
    return normalizeEmail(tenderQueriesMatch[1]);
  }

  return "Not Found";
}

/* =========================================================
   WEBSITE
========================================================= */

function normalizeWebsite(value) {
  if (!value) {
    return "Not Found";
  }

  return value
    .replace(/\\/g, "")
    .trim()
    .replace(/[.,;]+$/, "");
}

function extractExplicitWebsite(text) {
  const patterns = [
    /\bOfficial\s+Website\s*[:\-]\s*(https?:\/\/[^\s]+)/i,

    /\bOfficial\s+Website\s*[:\-]\s*(www\.[^\s]+)/i,

    /\bWebsite\s*[:\-]\s*(https?:\/\/[^\s]+)/i,

    /\bWebsite\s*[:\-]\s*(www\.[^\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match && match[1]) {
      return normalizeWebsite(match[1]);
    }
  }

  return "Not Found";
}

/* =========================================================
   SECTION EXTRACTION
========================================================= */

function extractSection(text, startHeadings, endHeadings) {
  const normalized = normalizeText(text);

  const startPattern = startHeadings
    .map((heading) => heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const endPattern = endHeadings
    .map((heading) => heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const regex = new RegExp(
    `(?:${startPattern})\\s*[:\\-]?\\s*([\\s\\S]*?)(?=\\b(?:${endPattern})\\b|$)`,
    "i",
  );

  const match = normalized.match(regex);

  if (!match || !match[1]) {
    return "Not Found";
  }

  return cleanSection(match[1]);
}

/* =========================================================
   TECHNICAL QUALIFICATION
========================================================= */

function extractTechnicalQualification(text) {
  return extractSection(
    text,

    [
      "Technical Qualification",
      "Technical Eligibility",
      "Technical Criteria",
      "Technical Requirements",
      "Eligibility Criteria - Technical",
    ],

    [
      "Financial Eligibility",
      "Financial Qualification",
      "Financial Eligibility Criteria",
      "Financial Criteria",
      "Scope of Work",
      "Scope of Supply",
      "Scope of Services",
      "Commercial Conditions",
      "Commercial Terms",
      "Payment Terms",
      "Contact Information",
      "Amendment Notice",
      "Amendment No",
      "Corrigendum",
      "Important Notes",
      "End of Document",
    ],
  );
}

/* =========================================================
   FINANCIAL QUALIFICATION
========================================================= */

function extractFinancialQualification(text) {
  return extractSection(
    text,

    [
      "Financial Eligibility",
      "Financial Qualification",
      "Financial Eligibility Criteria",
      "Financial Criteria",
      "Eligibility Criteria - Financial",
    ],

    [
      "Scope of Work",
      "Scope of Supply",
      "Scope of Services",
      "Commercial Conditions",
      "Commercial Terms",
      "Payment Terms",
      "Contact Information",
      "Amendment Notice",
      "Amendment No",
      "Corrigendum",
      "Important Notes",
      "End of Document",
    ],
  );
}

/* =========================================================
   SCOPE OF WORK
========================================================= */

function extractScopeOfWork(text) {
  return extractSection(
    text,

    [
      "Scope of Work",
      "Scope of Supply",
      "Scope of Services",
      "Work Scope",
      "Description of Work",
      "Work Description",
    ],

    [
      "Commercial Conditions",
      "Commercial Terms",
      "Payment Terms",
      "Contact Information",
      "Amendment Notice",
      "Amendment No",
      "Corrigendum",
      "Important Notes",
      "Financial Eligibility",
      "Financial Qualification",
      "End of Document",
    ],
  );
}

/* =========================================================
   CORRIGENDUM / AMENDMENT
========================================================= */

function extractActualCorrigendum(text) {
  const normalized = normalizeText(text);

  /*
   * Ignore generic:
   *
   * Corrigendum if any
   *
   * unless an actual amendment/corrigendum exists.
   */

  const actualAmendmentPattern =
    /\b(?:AMENDMENT|CORRIGENDUM)\s*(?:NO\.?\s*\d+)?[\s\S]{0,5000}?(?:revised|amended|changed|extended|modified|remains unchanged)/i;

  const actualMatch = normalized.match(actualAmendmentPattern);

  if (!actualMatch) {
    return "Not Found";
  }

  /*
   * Locate the actual amendment/corrigendum heading.
   */

  const headingMatch = normalized.match(
    /\b(?:AMENDMENT|CORRIGENDUM)\s+(?:NO\.?\s*\d+)\b/i,
  );

  if (headingMatch && headingMatch.index !== undefined) {
    const start = headingMatch.index;

    let section = normalized.slice(start);

    /*
     * Stop at Important Notes / End of Document.
     */

    section = section.split(/\bIMPORTANT\s+NOTES\b/i)[0];

    section = section.split(/\bEND\s+OF\s+DOCUMENT\b/i)[0];

    return cleanSection(section);
  }

  /*
   * Fallback.
   */

  return cleanSection(actualMatch[0]);
}

/* =========================================================
   DETERMINISTIC OVERRIDES
========================================================= */

function applyDeterministicOverrides(text, metadata) {
  const normalized = normalizeText(text);

  const finalMetadata = {
    ...metadata,
  };

  /*
   * Tender ID
   */

  const tenderId = extractExplicitTenderId(normalized);

  if (tenderId !== "Not Found") {
    finalMetadata.tenderId = tenderId;
  }

  /*
   * Tender No
   */

  const tenderNo = extractExplicitTenderNo(normalized);

  if (tenderNo !== "Not Found") {
    finalMetadata.tenderNo = tenderNo;
  }

  /*
   * Tender Authority
   */

  const authority = extractExplicitTenderAuthority(normalized);

  if (authority !== "Not Found") {
    finalMetadata.tenderAuthority = authority;
  }

  /*
   * Opening Date
   */

  const openingDate = extractExplicitOpeningDate(normalized);

  if (openingDate !== "Not Found") {
    finalMetadata.openingDate = openingDate;
  }

  /*
   * Closing Date
   *
   * Revised date always wins.
   */

  const revisedClosingDate = extractRevisedClosingDate(normalized);

  if (revisedClosingDate !== "Not Found") {
    finalMetadata.closingDate = revisedClosingDate;
  } else {
    const closingDate = extractExplicitClosingDate(normalized);

    if (closingDate !== "Not Found") {
      finalMetadata.closingDate = closingDate;
    }
  }

  /*
   * Tender Amount
   */

  const tenderAmount = extractExplicitMoney(normalized, [
    "Estimated Tender Value",
    "Estimated Bid Value",
    "Estimated Amount",
    "Estimated Cost",
    "Tender Value",
    "Approximate Tender Value",
  ]);

  if (tenderAmount !== "Not Found") {
    finalMetadata.tenderAmount = tenderAmount;
  }

  /*
   * EMD
   *
   * Revised EMD has priority.
   */

  const revisedEmd = extractRevisedEmd(normalized);

  if (revisedEmd !== "Not Found") {
    finalMetadata.emd = revisedEmd;
  } else {
    const emd = extractExplicitEmd(normalized);

    if (emd !== "Not Found") {
      finalMetadata.emd = emd;
    }
  }

  /*
   * Tender Fee
   */

  const tenderFee = extractExplicitMoney(normalized, [
    "Tender Fee",
    "Tender Participation Fee",
    "Bid Participation Fee",
  ]);

  if (tenderFee !== "Not Found") {
    finalMetadata.tenderFee = tenderFee;
  }

  /*
   * Document Cost
   */

  const documentCost = extractExplicitDocumentCost(normalized);

  if (documentCost !== "Not Found") {
    finalMetadata.documentCost = documentCost;
  }

  /*
   * Tab Name
   */

  const tabName = extractExplicitTabName(normalized);

  if (tabName !== "Not Found") {
    finalMetadata.tabName = tabName;
  }

  /*
   * Technical Qualification
   */

  const technicalQualification = extractTechnicalQualification(normalized);

  if (technicalQualification !== "Not Found") {
    finalMetadata.technicalQualification = technicalQualification;
  }

  /*
   * Financial Qualification
   */

  const financialQualification = extractFinancialQualification(normalized);

  if (financialQualification !== "Not Found") {
    finalMetadata.financialQualification = financialQualification;
  }

  /*
   * Scope
   */

  const scopeOfWork = extractScopeOfWork(normalized);

  if (scopeOfWork !== "Not Found") {
    finalMetadata.scopeOfWork = scopeOfWork;
  }

  /*
   * Corrigendum
   */

  const corrigendum = extractActualCorrigendum(normalized);

  if (corrigendum !== "Not Found") {
    finalMetadata.corrigendum = corrigendum;
  }

  /*
   * Purchaser Address
   */

  const purchaserAddress = extractPurchaserAddress(normalized);

  if (purchaserAddress !== "Not Found") {
    finalMetadata.purchaserAddress = purchaserAddress;
  }

  /*
   * Email
   */

  const email = extractTenderContactEmail(normalized);

  if (email !== "Not Found") {
    finalMetadata.email = email;
  }

  /*
   * Website
   */

  const website = extractExplicitWebsite(normalized);

  if (website !== "Not Found") {
    finalMetadata.website = website;
  }

  /*
   * Normalize monetary fields.
   */

  if (
    finalMetadata.tenderAmount &&
    finalMetadata.tenderAmount !== "Not Found"
  ) {
    finalMetadata.tenderAmount = normalizeMoneyValue(
      finalMetadata.tenderAmount,
    );
  }

  if (finalMetadata.emd && finalMetadata.emd !== "Not Found") {
    finalMetadata.emd = normalizeMoneyValue(finalMetadata.emd);
  }

  if (finalMetadata.tenderFee && finalMetadata.tenderFee !== "Not Found") {
    finalMetadata.tenderFee = normalizeMoneyValue(finalMetadata.tenderFee);
  }

  if (
    finalMetadata.documentCost &&
    finalMetadata.documentCost !== "Not Found"
  ) {
    finalMetadata.documentCost = normalizeMoneyValue(
      finalMetadata.documentCost,
    );
  }

  /*
   * Normalize email.
   */

  if (finalMetadata.email && finalMetadata.email !== "Not Found") {
    finalMetadata.email = normalizeEmail(finalMetadata.email);
  }

  /*
   * Normalize website.
   */

  if (finalMetadata.website && finalMetadata.website !== "Not Found") {
    finalMetadata.website = normalizeWebsite(finalMetadata.website);
  }

  return finalMetadata;
}

/* =========================================================
   GEMINI ENRICHMENT
========================================================= */

async function enrichMetadataWithAI(text, metadata) {
  const missingFields = getMissingFields(metadata);

  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      "GEMINI_API_KEY not configured. Skipping AI metadata enrichment.",
    );

    return applyDeterministicOverrides(text, metadata);
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
You are an expert tender-document metadata extraction system.

Extract structured metadata from the tender document below.

Your highest priority is ACCURACY.

==================================================
CORE RULE
==================================================

ONLY use information explicitly supported by the document.

Never:
- guess
- fabricate
- assume
- calculate missing values
- invent identifiers
- infer websites
- infer locations
- infer item categories

If information is not explicitly available:

"Not Found"

==================================================
EXISTING METADATA
==================================================

The backend already extracted:

${JSON.stringify(metadata, null, 2)}

Existing values are generally reliable.

Use Gemini primarily as a fallback for missing or difficult semantic fields.

==================================================
TENDER ID
==================================================

Use ONLY an explicitly labelled:

- Tender ID
- Tender Id
- TenderID
- Bid ID
- BidID

NEVER copy Tender No into Tender ID.

If Tender ID does not exist:

"Not Found"

==================================================
TENDER NO
==================================================

Use explicitly labelled:

- Tender No
- Tender Number
- Tender Reference
- Tender Ref
- Enquiry No
- Bid No
- Bid Number

Preserve the complete identifier.

==================================================
TENDER AUTHORITY
==================================================

Use the organization explicitly issuing/inviting the tender.

Prefer:
- Tender Inviting Authority
- Tender Authority
- Issuing Authority
- Organization
- Organisation

Do not use an individual's name unless clearly identified as the authority.

==================================================
LOCATION
==================================================

Use explicitly stated:
- work location
- project location
- execution location
- delivery location
- site location
- tender location

Do not infer from:
- email
- PIN code
- company name

==================================================
OPENING DATE
==================================================

Use explicitly labelled:
- Technical Bid Opening
- Bid Opening
- Tender Opening
- Opening Date

Do not confuse with issue date or closing date.

==================================================
CLOSING DATE
==================================================

Use the CURRENT/LATEST submission closing date.

If an actual amendment changes it, use the revised date.

==================================================
TENDER AMOUNT
==================================================

Use only:
- Estimated Tender Value
- Estimated Bid Value
- Estimated Amount
- Estimated Cost
- Tender Value

Never confuse it with:
- EMD
- tender fee
- document cost
- security deposit
- turnover
- payment amount

==================================================
EMD
==================================================

Use EMD amount/status.

If an actual amendment revises EMD,
use the revised amount.

==================================================
DOCUMENT COST
==================================================

Use explicitly stated document cost.

If explicitly:

"Not Applicable"

return:

"Not Applicable"

Do not replace it with Not Found.

==================================================
TENDER FEE
==================================================

Use only explicitly stated tender/bid participation fee.

==================================================
TAB NAME
==================================================

Use ONLY explicit:

- Item Category
- Primary Product Category
- Product Category
- Tab Name
- Item Name
- Product Name

NEVER derive Tab Name from:
- tender title
- name of work
- scope
- description
- keywords

==================================================
TECHNICAL QUALIFICATION
==================================================

Extract ONLY the technical qualification section.

Include:
- technical experience
- technical eligibility
- technical certificates
- OEM requirements
- authorization
- technical compliance
- past technical work

STOP when:
- Financial Eligibility begins
- Financial Qualification begins
- Scope begins
- Commercial Conditions begin
- Contact Information begins
- Amendment begins

DO NOT include those sections.

==================================================
FINANCIAL QUALIFICATION
==================================================

Extract ONLY financial eligibility.

Include:
- turnover
- average turnover
- net worth
- financial capacity
- audited financial statements when required for eligibility
- financial eligibility criteria

DO NOT include:
- GST
- payment terms
- invoices
- EMD
- security deposit
- performance security
- commercial terms

==================================================
SCOPE OF WORK
==================================================

Extract ONLY actual supply/work/service scope.

Include:
- supply
- installation
- commissioning
- testing
- maintenance
- delivery
- service activities

STOP before:
- commercial conditions
- payment terms
- contact information
- amendment

==================================================
TENDER SUMMARY
==================================================

Write a useful 1–2 sentence factual summary.

Mention:
- what is being procured
- quantity if explicitly stated
- major purpose/use
- important location if explicitly relevant

DO NOT simply copy one short product-description sentence.

==================================================
TENDER DESCRIPTION
==================================================

Prefer the explicit:
- Product Description
- Item Description
- Tender Description
- Service Description

If an explicit product description exists, preserve its substance.

Do not invent details.

==================================================
CORRIGENDUM
==================================================

Only actual amendments/corrigenda count.

This does NOT count:

"Corrigendum if any will be published..."

If an actual amendment exists, report it.

If Amendment No. 1 changes EMD from one value to another,
include that change.

==================================================
PURCHASER ADDRESS
==================================================

Use explicitly identified:
- Purchaser Address
- Buyer Address
- Consignee Address
- Office Address
- Registered Office

==================================================
EMAIL
==================================================

Prefer:

1. Buyer Email
2. Tender Contact Email
3. Tender/Commercial/Procurement Email
4. Other clearly identified tender contact

If multiple emails exist, choose the primary tender contact.

Do not choose accounts email when a better tender contact exists.

==================================================
WEBSITE
==================================================

Use only explicitly stated website.

Never construct it from an email address.

==================================================
AMENDMENTS
==================================================

If an actual amendment changes a value:

Use the revised/current value in the relevant field.

Mention the original and revised values in Corrigendum.

==================================================
FINAL CHECK
==================================================

Before returning JSON verify:

1. Tender ID was not copied from Tender No.
2. Tender No is complete.
3. Current closing date is used.
4. Revised EMD is used when applicable.
5. Tab Name comes only from an explicit item/category label.
6. Technical Qualification contains only technical content.
7. Financial Qualification contains only financial eligibility.
8. Scope contains only scope.
9. Generic "Corrigendum if any" is ignored.
10. Tender email is the most relevant tender contact.
11. Summary is a useful tender summary.
12. Description is the actual product/item/service description.
13. No value was guessed.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON matching the schema.

No markdown.
No explanations.
No citations.
No confidence scores.

==================================================
TENDER DOCUMENT
==================================================

${text}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,

      contents: prompt,

      config: {
        responseMimeType: "application/json",

        responseSchema: metadataSchema,
      },
    });

    const aiMetadata = JSON.parse(response.text);

    const finalMetadata = {
      ...metadata,
    };

    /*
     * Gemini fills missing fields.
     */

    for (const field of missingFields) {
      const aiValue = aiMetadata[field];

      if (
        aiValue !== undefined &&
        aiValue !== null &&
        String(aiValue).trim() !== "" &&
        aiValue !== "Not Found"
      ) {
        finalMetadata[field] = aiValue;
      }
    }

    /*
     * Deterministic extraction ALWAYS
     * runs after Gemini.
     *
     * Explicit document evidence wins.
     */

    return applyDeterministicOverrides(text, finalMetadata);
  } catch (error) {
    console.error("AI metadata extraction failed:", error.message);

    /*
     * Gemini failure must not
     * break the scanner.
     */

    return applyDeterministicOverrides(text, metadata);
  }
}

module.exports = enrichMetadataWithAI;
