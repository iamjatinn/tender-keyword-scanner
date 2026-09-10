import React from "react";

export const ErrorAlert = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="alert alert-danger">
      <div className="alert-content">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>

        <span>{message}</span>
      </div>

      {onDismiss && (
        <button type="button" className="alert-close" onClick={onDismiss}>
          &times;
        </button>
      )}
    </div>
  );
};
