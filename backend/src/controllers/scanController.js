const extractText = require("../services/textExtractor");

const {
  findMatches,
  calculateRelevance,
} = require("../services/keywordMatcher");

const { extractTenderMetadata } = require("../services/tenderExtractor");

const enrichMetadataWithAI = require("../services/aiExtractor");

const generateExcel = require("../services/excelGenerator");

const scanTender = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded.",
      });
    }

    const results = [];

    for (const file of files) {
      const text = await extractText(file.path, file.mimetype);

      const matches = findMatches(text);

      // First extract metadata using deterministic rules
      const ruleBasedMetadata = extractTenderMetadata(text);

      // Then use Gemini to fill missing/ambiguous metadata
      const metadata = await enrichMetadataWithAI(text, ruleBasedMetadata);

      results.push({
        documentName: file.originalname,
        metadata,
        matchedKeywords: matches,
        matchCount: matches.length,
        relevance: calculateRelevance(matches.length),
      });
    }

    const excelFileName = generateExcel(results);

    res.json({
      message: "Documents scanned successfully.",
      results,
      excelFile: `/reports/${excelFileName}`,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Error scanning documents.",
      error: error.message,
    });
  }
};

module.exports = { scanTender };
