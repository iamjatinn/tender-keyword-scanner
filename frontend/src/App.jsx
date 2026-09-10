import React, { useState } from "react";

import { Header } from "./components/Header";
import { FileUpload } from "./components/FileUpload";
import { SelectedFilesList } from "./components/SelectedFilesList";
import { SummaryCards } from "./components/SummaryCards";
import { ResultsTable } from "./components/ResultsTable";
import { MetadataModal } from "./components/MetadataModal";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { ErrorAlert } from "./components/ErrorAlert";

import { scanTenderDocuments } from "./config/api";

export function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [excelFile, setExcelFile] = useState(null);
  const [inspectingItem, setInspectingItem] = useState(null);

  const handleFilesAdded = (newFiles) => {
    setSelectedFiles((previousFiles) => {
      const existingNames = new Set(previousFiles.map((file) => file.name));

      const filteredFiles = newFiles.filter(
        (file) => !existingNames.has(file.name),
      );

      return [...previousFiles, ...filteredFiles];
    });

    setError(null);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((previousFiles) =>
      previousFiles.filter((_, i) => i !== index),
    );
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
  };

  const handleStartScan = async () => {
    if (selectedFiles.length === 0) {
      setError("Please attach at least one PDF or DOCX file to scan.");
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanProgress(0);

    try {
      const data = await scanTenderDocuments(selectedFiles, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );

          setScanProgress(percent);
        }
      });

      if (data && data.results) {
        setScanResults(data.results);
        setExcelFile(data.excelFile || null);
        setScanProgress(100);
      } else {
        setError("Received unexpected response format from server.");
      }
    } catch (err) {
      console.error("Scan Error:", err);

      const serverMessage =
        err.response?.data?.message ||
        "Failed to complete document scan. Make sure the backend is running on http://localhost:5000.";

      setError(serverMessage);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="app-shell">
      <Header />

      <main className="main-content">
        <div className="container">
          <ErrorAlert message={error} onDismiss={() => setError(null)} />

          <section className="section upload-section">
            <div className="section-header">
              <h2 className="section-title">Document Ingestion</h2>

              <p className="section-description">
                Upload tender bidding files for automated keyword detection and
                relevance classification.
              </p>
            </div>

            <FileUpload
              onFilesAdded={handleFilesAdded}
              isScanning={isScanning}
            />

            <SelectedFilesList
              files={selectedFiles}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAll}
              onStartScan={handleStartScan}
              isScanning={isScanning}
            />
          </section>

          {isScanning && <LoadingIndicator progress={scanProgress} />}

          {scanResults && (
            <section className="section results-section">
              <SummaryCards results={scanResults} />

              <ResultsTable
                results={scanResults}
                excelFile={excelFile}
                onInspectMetadata={(item) => setInspectingItem(item)}
              />
            </section>
          )}
        </div>
      </main>

      {inspectingItem && (
        <MetadataModal
          result={inspectingItem}
          onClose={() => setInspectingItem(null)}
        />
      )}
    </div>
  );
}

export default App;
