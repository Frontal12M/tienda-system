import api from "../api/axiosConfig";

export const getDashboardReport = async () => {
  const response = await api.get("/reports/dashboard");
  return response.data;
};