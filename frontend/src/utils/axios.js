import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.PROD ? "" : "http://localhost:4000",
});

// axios request 헤더에 토큰 추가
axiosInstance.interceptors.request.use(
    function (config) {
        config.headers.Authorization =
            "Bearer " + localStorage.getItem("accessToken");
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// 토큰 만료
axiosInstance.interceptors.response.use(
    function (response) {
        return response;
    },
    function (error) {
        if (error.response.data === "jwt expired") {
            window.location.reload();
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
