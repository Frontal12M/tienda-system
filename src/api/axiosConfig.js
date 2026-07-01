import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
});

api.interceptors.request.use(
  (config) => {
    const authData = JSON.parse(localStorage.getItem("authData"));

    if (authData?.token) {
      config.headers.Authorization = `Bearer ${authData.token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;