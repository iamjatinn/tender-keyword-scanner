import React, { useRef, useState } from "react";

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

export const FileUpload = ({ onFilesAdded, isScanning }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndEmit = (fileList) => {
    const validFiles = Array.from(fileList).filter((file) => {
      const ext = "." + file.name.split(".").pop().toLowerCase();
      return ALLOWED_EXTENSIONS.includes(ext);
    });

    if (validFiles.length < fileList.length) {
      alert(
        "Some files were ignored. Only PDF and DOCX documents are supported.",
      );
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isScanning) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndEmit(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndEmit(e.target.files);
    }

    e.target.value = "";
  };

  return (
    <div
      className={`dropzone ${isDragOver ? "drag-over" : ""} ${
        isScanning ? "disabled" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isScanning && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        disabled={isScanning}
      />

      <div className="dropzone-content">
        <div className="upload-icon-wrapper">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div className="dropzone-text">
          <span className="dropzone-primary">Click to select documents</span> or
          drag and drop files here
        </div>

        <div className="dropzone-hint">
          Supported Formats: PDF, DOCX (Batch upload supported)
        </div>
      </div>
    </div>
  );
};
