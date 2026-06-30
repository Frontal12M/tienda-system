import api from "../api/axiosConfig";

export const createCashMovement = async (cashMovement) => {
  const response = await api.post("/cash-movements", cashMovement);
  return response.data;
};

export const getAllCashMovements = async () => {
  const response = await api.get("/cash-movements");
  return response.data;
};

export const getCashMovementsByCashRegister = async (cashRegisterId) => {
  const response = await api.get(
    `/cash-movements/cash-register/${cashRegisterId}`
  );
  return response.data;
};

export const getCashMovementsByType = async (type) => {
  const response = await api.get(`/cash-movements/type/${type}`);
  return response.data;
};

export const getCashMovementsByUser = async (userId) => {
  const response = await api.get(`/cash-movements/user/${userId}`);
  return response.data;
};