import api from "../api/axiosConfig";

export const getAllInventoryMovements = async () => {
  const response = await api.get("/inventory-movements");
  return response.data;
};

export const createInventoryMovement = async (movement) => {
  const response = await api.post("/inventory-movements", movement);
  return response.data;
};