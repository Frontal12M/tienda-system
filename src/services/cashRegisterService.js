import api from "../api/axiosConfig";

export const openCashRegister = async (cashRegister) => {
  const response = await api.post("/cash-registers/open", cashRegister);
  return response.data;
};

export const getAllCashRegisters = async () => {
  const response = await api.get("/cash-registers");
  return response.data;
};

export const getOpenCashRegister = async () => {
  try {
    const response = await api.get("/cash-registers/open");
    return response.data;
  } catch (error) {
    if (error.response?.status === 400) {
      return {
        responseString: "No hay caja abierta",
        responseObject: null,
        responseBoolean: false,
      };
    }

    throw error;
  }
};

export const getCashRegisterById = async (id) => {
  const response = await api.get(`/cash-registers/${id}`);
  return response.data;
};

export const closeCashRegister = async (id, cashRegister) => {
  const response = await api.patch(`/cash-registers/${id}/close`, cashRegister);
  return response.data;
};