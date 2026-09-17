import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { hashToken, randomToken, signAccessToken, signRefreshToken } from '../utils/tokens.js';

const signupSchema=z.object({email:z.string().email(),password:z.string().min(8),username:z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),displayName:z.string().max(80).optional()});
const loginSchema=z.object({email:z.string().email(),password:z.string().min(1)});
const cookieName='refresh_token';
const cookieOptions=()=>({httpOnly:true,secure:process.env.COOKIE_SECURE==='true',sameSite:process.env.COOKIE_SAME_SITE||'lax',path:'/api/auth',maxAge:7*24*60*60*1000});
function publicUser(u){return {_id:u._id,email:u.email,username:u.username,displayName:u.displayName,avatar:u.avatar,emailVerified:u.emailVerified};}
async function issueRefresh(user,res){
  const jti=randomUUID(); const token=signRefreshToken(user,jti);
  await RefreshToken.create({userId:user._id,tokenHash:hashToken(token),jti,expiresAt:new Date(Date.now()+7*24*60*60*1000)});
  res.cookie(cookieName,token,cookieOptions());
  return signAccessToken(user);
}
export async function signup(req,res,next){try{
  const data=signupSchema.parse(req.body); const email=data.email.toLowerCase(), username=data.username.toLowerCase();
  if(await User.exists({$or:[{email},{username}]})) return res.status(409).json({message:'Email or username already exists'});
  const passwordHash=await bcrypt.hash(data.password,12); const verification=randomToken();
  const user=await User.create({email,passwordHash,username,displayName:data.displayName||username,verificationTokenHash:hashToken(verification),verificationExpiresAt:new Date(Date.now()+24*60*60*1000)});
  const accessToken=await issueRefresh(user,res);
  res.status(201).json({user:publicUser(user),accessToken,verificationToken:process.env.NODE_ENV==='production'?undefined:verification,message:'Verification simulated; use the returned token in /verify-email during local development.'});
}catch(e){next(e)}}
export async function verifyEmail(req,res,next){try{
  const {token}=req.body; if(!token)return res.status(400).json({message:'Verification token required'});
  const user=await User.findOne({verificationTokenHash:hashToken(token),verificationExpiresAt:{$gt:new Date()}}); if(!user)return res.status(400).json({message:'Invalid or expired verification token'});
  user.emailVerified=true; user.verificationTokenHash=null; user.verificationExpiresAt=null; await user.save(); res.json({message:'Email verified',user:publicUser(user)});
}catch(e){next(e)}}
export async function login(req,res,next){try{
  const data=loginSchema.parse(req.body); const user=await User.findOne({email:data.email.toLowerCase()});
  if(!user||!(await bcrypt.compare(data.password,user.passwordHash)))return res.status(401).json({message:'Invalid email or password'});
  const accessToken=await issueRefresh(user,res); res.json({user:publicUser(user),accessToken});
}catch(e){next(e)}}
export async function refresh(req,res,next){try{
  const old=req.cookies[cookieName]; if(!old)return res.status(401).json({message:'Refresh token required'});
  const decoded=await import('jsonwebtoken').then(m=>m.default.verify(old,process.env.JWT_REFRESH_SECRET));
  const record=await RefreshToken.findOne({jti:decoded.jti,tokenHash:hashToken(old),revokedAt:null});
  if(!record)return res.status(401).json({message:'Refresh token revoked or invalid'});
  record.revokedAt=new Date(); await record.save(); const user=await User.findById(decoded.sub); if(!user)return res.status(401).json({message:'User not found'});
  const accessToken=await issueRefresh(user,res); res.json({user:publicUser(user),accessToken});
}catch(e){res.status(401).json({message:'Refresh token expired or invalid'})}}
export async function logout(req,res,next){try{const token=req.cookies[cookieName];if(token)await RefreshToken.updateOne({tokenHash:hashToken(token),revokedAt:null},{$set:{revokedAt:new Date()}});res.clearCookie(cookieName,{...cookieOptions(),maxAge:undefined});res.json({message:'Logged out'});}catch(e){next(e)}}
export async function forgotPassword(req,res,next){try{
  const email=z.string().email().parse(req.body.email).toLowerCase(); const user=await User.findOne({email});
  if(!user)return res.json({message:'If the account exists, a reset token has been issued.'});
  const token=randomToken(); user.resetTokenHash=hashToken(token); user.resetExpiresAt=new Date(Date.now()+30*60*1000); await user.save();
  res.json({message:'Reset token issued for local simulation.',resetToken:process.env.NODE_ENV==='production'?undefined:token});
}catch(e){next(e)}}
export async function resetPassword(req,res,next){try{
  const schema=z.object({token:z.string().min(10),password:z.string().min(8)}); const {token,password}=schema.parse(req.body);
  const user=await User.findOne({resetTokenHash:hashToken(token),resetExpiresAt:{$gt:new Date()}}); if(!user)return res.status(400).json({message:'Invalid or expired reset token'});
  user.passwordHash=await bcrypt.hash(password,12);user.resetTokenHash=null;user.resetExpiresAt=null;await user.save();await RefreshToken.updateMany({userId:user._id,revokedAt:null},{$set:{revokedAt:new Date()}});res.json({message:'Password reset successfully'});
}catch(e){next(e)}}
