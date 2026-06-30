import api from "../api/axiosConfig";

export const getDashboardStats = async () => {
  const response = await api.get("/reports/dashboard");
  return response.data;
};