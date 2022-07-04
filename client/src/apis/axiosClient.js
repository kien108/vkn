import axios from 'axios';
import queryString from 'query-string';
import Qs from 'qs';

const controller = new AbortController();
const axiosClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'content-type': 'application/json'
    },
    signal: controller.signal,

    // dùng querystring
    paramsSerializer: params => queryString.stringify(params)
});

axiosClient.interceptors.request.use(async config => {
    // Handle token here ...
    config.paramsSerializer = params => {
        // Qs is already included in the Axios package
        return Qs.stringify(params, {
            arrayFormat: 'brackets',
            encode: false
        });
    };
    return config;
});

axiosClient.interceptors.response.use(
    response => {
        console.log(response);
        if (response?.data) {
            return response.data;
        }

        return response;
    },
    error => {}
);

export default axiosClient;
