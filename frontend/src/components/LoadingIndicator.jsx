import React from "react";

export const LoadingIndicator = ({ progress }) => {
  return (
    <div className="card loading-card">
      <div className="loading-content">
        <div className="spinner"></div>

        <div className="loading-text">
          <h3>Scanning Tender Documents...</h3>

          <p>
            Extracting text, analyzing procurement keywords, and generating
            report.
          </p>

          {progress > 0 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
