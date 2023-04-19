// 这段代码实现了一个使用 Axios 库封装的 HTTP 请求工具，可以用来向服务端发起 HTTP 请求并获取响应结果。

// 首先，使用 import 语句导入了 Axios 库和 useUserStoreHook 函数，后者用于获取用户信息存储仓库。

// 接下来，通过 axios.create 方法创建了一个 Axios 实例，并设置了该实例的基本配置，如请求的根地址、超时时间和请求头的 Content-Type。

// 然后，通过 service.interceptors.request.use 方法注册了一个请求拦截器，在请求发送之前可以对请求配置进行一些处理，例如设置请求头中的 Authorization 字段，该字段存储的是用户的 Token，以确保用户已经登录。在这里，通过调用 useUserStoreHook 函数获取了用户存储仓库的实例，从中获取了用户的 Token，并将其添加到请求头中。如果出现请求错误，则通过 Promise.reject 方法返回错误信息。

// 接着，通过 service.interceptors.response.use 方法注册了一个响应拦截器，在响应返回之后可以对响应结果进行处理，例如解析返回数据中的错误码和错误信息，并根据其进行相应的处理，例如显示错误提示框或跳转到登录页面。在这里，通过解析响应数据中的错误码和错误信息来判断响应是否成功，如果成功则返回响应数据，如果出现错误则通过 Promise.reject 方法返回错误信息。


import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { useUserStoreHook } from '@/store/modules/user';

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
});

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStoreHook();
    if (userStore.token) {
      config.headers.Authorization = userStore.token;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, msg } = response.data;
    if (code === '00000') {
      return response.data;
    }
    // 响应数据为二进制流处理(Excel导出)
    if (response.data instanceof ArrayBuffer) {
      return response;
    }

    ElMessage.error(msg || '系统出错');
    return Promise.reject(new Error(msg || 'Error'));
  },
  (error: any) => {
    if (error.response.data) {
      const { code, msg } = error.response.data;
      // token 过期,重新登录
      if (code === 'A0230') {
        ElMessageBox.confirm('当前页面已失效，请重新登录', '提示', {
          confirmButtonText: '确定',
          type: 'warning'
        }).then(() => {
          localStorage.clear();
          window.location.href = '/';
        });
      } else {
        ElMessage.error(msg || '系统出错');
      }
    }
    return Promise.reject(error.message);
  }
);

// 导出 axios 实例
export default service;
