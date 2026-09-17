import {createContext,useContext,useEffect,useState} from 'react';
import api,{bootstrapAuth,setAccessToken,clearAccessToken} from '../lib/api';
const C=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);useEffect(()=>{bootstrapAuth().then(d=>setUser(d?.user||null)).finally(()=>setLoading(false))},[]);const login=async payload=>{const r=await api.post('/auth/login',payload);setAccessToken(r.data.accessToken);setUser(r.data.user);return r.data};const signup=async payload=>{const r=await api.post('/auth/signup',payload);setAccessToken(r.data.accessToken);setUser(r.data.user);return r.data};const logout=async()=>{try{await api.post('/auth/logout')}finally{clearAccessToken();setUser(null)}};return <C.Provider value={{user,loading,login,signup,logout}}>{children}</C.Provider>}
export const useAuth=()=>useContext(C);
