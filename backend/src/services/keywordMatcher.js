const fs = require("fs");
const path = require("path");

function loadKeywords() {
  const filePath = path.join(__dirname, "../../keywords.csv");

  const content = fs.readFileSync(filePath, "utf-8");

  return content
    .split(/\r?\n/)
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createKeywordPattern(keyword) {
  const words = keyword.toLowerCase().trim().split(/\s+/);

  return words
    .map((word) => {
      // Handle simple singular/plural variations.
      // wrench -> wrench / wrenches
      // bolt -> bolt / bolts
      if (word.endsWith("y")) {
        return `${word.slice(0, -1)}(?:y|ies)`;
      }

      if (word.endsWith("s")) {
        const singular = word.slice(0, -1);

        // Example: wrenches -> wrench / wrenches
        if (word.endsWith("ches") || word.endsWith("shes")) {
          return `(?:${singular}|${word})`;
        }

        return `(?:${singular}|${word})`;
      }

      // Add simple plural forms for singular words.
      if (
        word.endsWith("ch") ||
        word.endsWith("sh") ||
        word.endsWith("s") ||
        word.endsWith("x") ||
        word.endsWith("z")
      ) {
        return `${word}(?:es)?`;
      }

      return `${word}(?:s)?`;
    })
    .join("\\s+");
}

function findMatches(text) {
  const keywords = loadKeywords();
  const normalizedText = normalizeText(text);

  const matches = [];

  for (const keyword of keywords) {
    const pattern = createKeywordPattern(keyword);

    const regex = new RegExp(`\\b${pattern}\\b`, "i");

    if (regex.test(normalizedText)) {
      matches.push(keyword);
    }
  }

  return matches;
}

function calculateRelevance(matchCount) {
  if (matchCount === 0) {
    return "Not Related";
  }

  if (matchCount <= 2) {
    return "Possible";
  }

  return "Related";
}

module.exports = {
  findMatches,
  calculateRelevance,
};
