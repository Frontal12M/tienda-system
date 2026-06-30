import api from "../api/axiosConfig";

export const getAllCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

export const createCategory = async (category) => {
  const response = await api.post("/categories", category);
  return response.data;
};

export const updateCategory = async (id, category) => {
  const response = await api.put(`/categories/${id}`, category);
  return response.data;
};

export const changeCategoryStatus = async (id) => {
  const response = await api.patch(`/categories/${id}/status`);
  return response.data;
};