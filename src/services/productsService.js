import api from "../api/axiosConfig";

export const getAllProducts = async () => {
  const response = await api.get("/products");
  return response.data;
};

export const createProduct = async (product) => {
  const response = await api.post("/products", product);
  return response.data;
};

export const updateProduct = async (id, product) => {
  const response = await api.put(`/products/${id}`, product);
  return response.data;
};

export const changeProductStatus = async (id) => {
  const response = await api.patch(`/products/${id}/status`);
  return response.data;
};