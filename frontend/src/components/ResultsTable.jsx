import React, { useState } from "react";
import { API_BASE_URL } from "../config/api";

export const ResultsTable = ({ results, excelFile, onInspectMetadata }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [relevanceFilter, setRelevanceFilter] = useState("ALL");

  if (!results || results.length === 0) {
    return (
      <div className="card empty-state">
        <div className="empty-icon">📂</div>

        <h3>No Scan Results Yet</h3>

        <p>
          Upload tender documents above and click "Run Keyword Scan" to view
          matched intelligence.
        </p>
      </div>
    );
  }

  const filteredResults = results.filter((item) => {
    const documentName = item.documentName?.toLowerCase() || "";

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      documentName.includes(search) ||
      (item.matchedKeywords &&
        item.matchedKeywords.some((keyword) =>
          keyword.toLowerCase().includes(search),
        ));

    const matchesRelevance =
      relevanceFilter === "ALL" || item.relevance === relevanceFilter;

    return matchesSearch && matchesRelevance;
  });

  const getRelevanceBadgeClass = (relevance) => {
   switch (relevance) {
     case "Related":
       return "badge-relevance-yes";

     case "Possible":
       return "badge-relevance-possible";

     case "Not Related":
       return "badge-relevance-no";

     default:
       return "badge-neutral";
   }
  };

  const handleDownloadExcel = () => {
    if (!excelFile) return;

    const downloadUrl = excelFile.startsWith("http")
      ? excelFile
      : `${API_BASE_URL}${excelFile}`;

    window.open(downloadUrl, "_blank");
  };

  return (
    <div className="card results-card">
      <div className="card-header results-header">
        <div>
          <h2 className="card-title-lg">Tender Scan Results</h2>

          <p className="card-subtitle">
            Showing {filteredResults.length} of {results.length} processed
            documents
          </p>
        </div>

        {excelFile && (
          <button
            type="button"
            className="btn btn-success btn-download"
            onClick={handleDownloadExcel}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Excel Report
          </button>
        )}
      </div>

      <div className="table-controls">
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            className="form-control"
            placeholder="Filter by document name or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-wrapper">
          <label className="filter-label">Relevance:</label>

          <select
            className="form-select"
            value={relevanceFilter}
            onChange={(e) => setRelevanceFilter(e.target.value)}
          >
            <option value="ALL">All Relevances</option>

            <option value="Related">Related</option>

            <option value="Possible">Possible</option>

            <option value="Not Related">Not Related</option>
          </select>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Document Name</th>

              <th style={{ width: "35%" }}>Matched Keywords</th>

              <th style={{ width: "10%" }} className="text-center">
                Matches
              </th>

              <th style={{ width: "12%" }} className="text-center">
                Relevance
              </th>

              <th style={{ width: "13%" }} className="text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-muted">
                  No matching results found for current filters.
                </td>
              </tr>
            ) : (
              filteredResults.map((item, index) => (
                <tr key={`${item.documentName}-${index}`}>
                  <td className="font-medium text-main">
                    <div className="doc-name-cell">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>

                      <span title={item.documentName}>{item.documentName}</span>
                    </div>
                  </td>

                  <td>
                    <div className="keywords-flex">
                      {item.matchedKeywords &&
                      item.matchedKeywords.length > 0 ? (
                        item.matchedKeywords.map((keyword, keywordIndex) => (
                          <span key={keywordIndex} className="keyword-pill">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted text-sm">None matched</span>
                      )}
                    </div>
                  </td>

                  <td className="text-center">
                    <span className="count-badge">{item.matchCount ?? 0}</span>
                  </td>

                  <td className="text-center">
                    <span
                      className={`badge ${getRelevanceBadgeClass(
                        item.relevance,
                      )}`}
                    >
                      {item.relevance || "N/A"}
                    </span>
                  </td>

                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onInspectMetadata(item)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
