import api from "../api/axiosConfig";

export const getAllUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const getActiveUsers = async () => {
  const response = await api.get("/users/active");
  return response.data;
};

export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (user) => {
  const response = await api.post("/users", user);
  return response.data;
};

export const updateUser = async (id, user) => {
  const response = await api.put(`/users/${id}`, user);
  return response.data;
};

export const activateUser = async (id) => {
  const response = await api.patch(`/users/${id}/activate`);
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await api.patch(`/users/${id}/deactivate`);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};