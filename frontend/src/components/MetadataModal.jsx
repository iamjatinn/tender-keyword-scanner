import React from "react";

export const MetadataModal = ({ result, onClose }) => {
  if (!result) return null;

  const metadata = result.metadata || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Tender Details Inspection</h3>

            <p className="modal-subtitle">{result.documentName}</p>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="metadata-summary-bar">
            <div>
              <span className="meta-label">Relevance Returned:</span>

              <strong className="meta-val">{result.relevance}</strong>
            </div>

            <div>
              <span className="meta-label">Total Keywords Matched:</span>

              <strong className="meta-val">{result.matchCount}</strong>
            </div>
          </div>

          <h4 className="section-heading">Extracted Metadata</h4>

          <div className="metadata-grid">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="meta-item">
                <span className="meta-key">{formatKeyLabel(key)}</span>

                <span
                  className={`meta-value ${
                    value === "Not Found" ? "text-muted" : ""
                  }`}
                >
                  {value || "Not Found"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Inspection
          </button>
        </div>
      </div>
    </div>
  );
};

function formatKeyLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}
