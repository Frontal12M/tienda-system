import api from "../api/axiosConfig";

export const getAllSales = async () => {
  const response = await api.get("/sales");
  return response.data;
};

export const getSaleById = async (id) => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (sale) => {
  const response = await api.post("/sales", sale);
  return response.data;
};

export const cancelSale = async (id) => {
  const response = await api.patch(`/sales/${id}/cancel`);
  return response.data;
};