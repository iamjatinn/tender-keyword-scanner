import React from "react";

export const SummaryCards = ({ results }) => {
  if (!results || results.length === 0) return null;

  const totalDocuments = results.length;

  const matchedTenders = results.filter((r) => r.matchCount > 0).length;

  const highRelevance = results.filter((r) => r.relevance === "Related").length;

  const totalKeywords = results.reduce(
    (acc, curr) => acc + (curr.matchCount || 0),
    0,
  );

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <div className="kpi-label">Documents Scanned</div>
        <div className="kpi-value">{totalDocuments}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Matched Tenders</div>
        <div className="kpi-value">{matchedTenders}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">High Relevance (Related)</div>
        <div className="kpi-value highlight-positive">{highRelevance}</div>
      </div>

      <div className="kpi-card">
        <div className="kpi-label">Total Keywords Matched</div>
        <div className="kpi-value highlight-info">{totalKeywords}</div>
      </div>
    </div>
  );
};
