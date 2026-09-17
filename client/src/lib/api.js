import axios from 'axios';
const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api',withCredentials:true});
let accessToken=null; let refreshPromise=null;
export function setAccessToken(token){accessToken=token}
export function clearAccessToken(){accessToken=null}
api.interceptors.request.use(config=>{if(accessToken)config.headers.Authorization=`Bearer ${accessToken}`;return config});
api.interceptors.response.use(r=>r,async error=>{const original=error.config;if(error.response?.status===401 && (!original || original._retry)) return Promise.reject(error); if(error.response?.status===401 && !original._retry && !original.url?.includes('/auth/refresh')){original._retry=true;try{refreshPromise??=(api.post('/auth/refresh').then(r=>{accessToken=r.data.accessToken;return r}).finally(()=>refreshPromise=null));await refreshPromise;original.headers.Authorization=`Bearer ${accessToken}`;return api(original)}catch{return Promise.reject(error)}}return Promise.reject(error)});
export async function bootstrapAuth(){try{const r=await api.post('/auth/refresh');accessToken=r.data.accessToken;return r.data}catch{return null}}
export default api;
