import axios from "axios";

export const API_BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const scanTenderDocuments = async (files, onUploadProgress) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("documents", file);
  });

  const response = await api.post("/api/scan", formData, {
    onUploadProgress,
  });

  return response.data;
};

export default api;
