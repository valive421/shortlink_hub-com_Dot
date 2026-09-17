import {Navigate,useLocation} from 'react-router-dom';import {useAuth} from '../store/auth';
export default function ProtectedRoute({children}){const {user,loading}=useAuth();const loc=useLocation();if(loading)return <div className="min-h-screen grid place-items-center">Loading…</div>;return user?children:<Navigate to="/login" replace state={{from:loc.pathname}}/>}
