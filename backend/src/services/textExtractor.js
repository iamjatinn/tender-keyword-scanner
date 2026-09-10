const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

async function extractText(filePath, mimetype) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf" || mimetype === "application/pdf") {
    const buffer = fs.readFileSync(filePath);

    const parser = new pdfParse.PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    await parser.destroy();

    return result.text;
  }

  if (
    extension === ".docx" ||
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = require("mammoth");

    const result = await mammoth.extractRawText({
      path: filePath,
    });

    return result.value;
  }

  throw new Error("Unsupported file type");
}

module.exports = extractText;
