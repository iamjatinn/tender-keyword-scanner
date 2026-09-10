const XLSX = require("xlsx");
const path = require("path");

function generateExcel(results) {
  const worksheetData = results.map((result) => {
    const metadata = result.metadata;

    return {
      "Document Name": result.documentName,
      "Tender ID": metadata.tenderId,
      "Tender No": metadata.tenderNo,
      "Tender Authority": metadata.tenderAuthority,
      Location: metadata.location,
      "Opening Date": metadata.openingDate,
      "Closing Date": metadata.closingDate,
      "Tender Amount": metadata.tenderAmount,
      EMD: metadata.emd,
      "Document Cost": metadata.documentCost,
      "Tender Fee": metadata.tenderFee,
      "Tab Name": metadata.tabName,
      "Technical Qualification": metadata.technicalQualification,
      "Financial Qualification": metadata.financialQualification,
      "Scope of Work": metadata.scopeOfWork,
      "Tender Summary": metadata.tenderSummary,
      "Tender Description": metadata.tenderDescription,
      Corrigendum: metadata.corrigendum,
      "Purchaser Address": metadata.purchaserAddress,
      Email: metadata.email,
      Website: metadata.website,
      "Matched Keywords": result.matchedKeywords.length
        ? result.matchedKeywords.join(", ")
        : "(none found)",
      "Match Count": result.matchCount,
      "Relevance to Tritorc": result.relevance,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  worksheet["!cols"] = [
    { wch: 32 },
    { wch: 20 },
    { wch: 25 },
    { wch: 35 },
    { wch: 25 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 40 },
    { wch: 40 },
    { wch: 60 },
    { wch: 60 },
    { wch: 70 },
    { wch: 50 },
    { wch: 50 },
    { wch: 35 },
    { wch: 35 },
    { wch: 60 },
    { wch: 15 },
    { wch: 25 },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Tender Scan Report");

  const fileName = `tender-scan-${Date.now()}.xlsx`;

  const filePath = path.join(__dirname, "../../uploads", fileName);

  XLSX.writeFile(workbook, filePath);

  return fileName;
}

module.exports = generateExcel;
