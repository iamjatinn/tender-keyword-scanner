import React from "react";

export const SelectedFilesList = ({
  files,
  onRemoveFile,
  onClearAll,
  onStartScan,
  isScanning,
}) => {
  if (files.length === 0) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="card selected-files-card">
      <div className="card-header">
        <div className="card-title">
          <span>Staged Documents</span>
          <span className="badge badge-neutral">{files.length}</span>
        </div>

        <div className="card-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClearAll}
            disabled={isScanning}
          >
            Remove All
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onStartScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <span className="spinner-inline"></span>
                Scanning Documents...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Run Keyword Scan
              </>
            )}
          </button>
        </div>
      </div>

      <div className="files-grid">
        {files.map((file, index) => {
          const ext = file.name.split(".").pop().toLowerCase();

          return (
            <div key={`${file.name}-${index}`} className="file-chip">
              <span className={`file-tag tag-${ext}`}>{ext.toUpperCase()}</span>

              <div className="file-info">
                <span className="file-name" title={file.name}>
                  {file.name}
                </span>

                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>

              <button
                type="button"
                className="btn-icon-remove"
                onClick={() => onRemoveFile(index)}
                disabled={isScanning}
                title="Remove File"
              >
                &times;
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
