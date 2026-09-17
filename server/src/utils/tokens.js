import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
export const signAccessToken=(user)=>jwt.sign({sub:user._id.toString(),email:user.email},process.env.JWT_ACCESS_SECRET,{expiresIn:process.env.ACCESS_TOKEN_TTL||'15m'});
export const signRefreshToken=(user,jti)=>jwt.sign({sub:user._id.toString(),jti},process.env.JWT_REFRESH_SECRET,{expiresIn:process.env.REFRESH_TOKEN_TTL||'7d'});
export const hashToken=(token)=>crypto.createHash('sha256').update(token).digest('hex');
export const randomToken=()=>crypto.randomBytes(32).toString('hex');
