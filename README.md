# Tender Keyword Scanner — Tritorc Relevance Checker

A full-stack web application that scans tender and Scope-of-Work (SOW) documents for Tritorc-relevant keywords and determines the relevance of each document.

The application supports PDF and DOCX files, extracts their text, searches for predefined bolting/flange-management/torque-tool keywords, calculates a relevance verdict dynamically, displays the results in a React interface, and generates a downloadable Excel report.

---

## Features

- Upload one or multiple tender/SOW documents
- Supports `.pdf` and `.docx` files
- Extracts text from uploaded documents
- Case-insensitive keyword matching
- Handles simple keyword variants such as:
  - `torque wrench`
  - `torque wrenches`
  - `bolt tensioner`
  - `bolt tensioners`
- Uses a configurable keyword list stored in `keywords.csv`
- Dynamically calculates document relevance based on keyword matches
- Displays scan results in a responsive React interface
- Displays extracted tender metadata
- Generates a downloadable Excel `.xlsx` report
- Supports multiple documents in a single scan
- Uses Gemini AI as an additional layer for structured tender metadata extraction
- Handles AI failures without stopping the overall document scan
- No database required

---

## Tech Stack

### Frontend

- React
- Vite
- Axios
- CSS

### Backend

- Node.js
- Express.js
- Multer
- pdf-parse
- Mammoth
- XLSX
- Google Gemini API
- CORS
- dotenv

### Development

- Nodemon

---

## Project Structure

```text
tender-keyword-scanner/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── uploads/
│   ├── keywords.csv
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── FileUpload.jsx
│   │   │   ├── SelectedFilesList.jsx
│   │   │   ├── SummaryCards.jsx
│   │   │   ├── ResultsTable.jsx
│   │   │   ├── MetadataModal.jsx
│   │   │   ├── LoadingIndicator.jsx
│   │   │   └── ErrorAlert.jsx
│   │   │
│   │   ├── config/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── package-lock.json
│
├── README.md
├── AI_NOTES.txt
└── DEPLOY.md
```
