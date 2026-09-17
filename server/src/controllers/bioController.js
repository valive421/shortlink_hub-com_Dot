import { z } from 'zod';
import User from '../models/User.js';
import BioProfile from '../models/BioProfile.js';
const schema=z.object({username:z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),displayName:z.string().max(80),bio:z.string().max(240),avatar:z.string().url().or(z.literal('')).optional(),theme:z.enum(['minimal','slate','gradient']),socialLinks:z.array(z.object({label:z.string().min(1).max(40),url:z.string().url(),platform:z.string().max(30).optional(),position:z.number().optional()})).max(20)});
export async function getMine(req,res,next){try{const user=await User.findById(req.user.sub).lean();let bio=await BioProfile.findOne({userId:user._id}).lean();if(!bio)bio={username:user.username,displayName:user.displayName||user.username,bio:'',avatar:user.avatar||'',theme:'minimal',socialLinks:[]};res.json({bio});}catch(e){next(e)}}
export async function upsertMine(req,res,next){try{
 const data=schema.parse(req.body); const existing=await BioProfile.findOne({username:data.username.toLowerCase(),userId:{$ne:req.user.sub}}); if(existing)return res.status(409).json({message:'Username already used'});
 const bio=await BioProfile.findOneAndUpdate({userId:req.user.sub},{...data,username:data.username.toLowerCase()},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}); await User.findByIdAndUpdate(req.user.sub,{username:bio.username,displayName:bio.displayName,avatar:bio.avatar});res.json({bio});
}catch(e){next(e)}}
export async function getPublic(req,res,next){try{const bio=await BioProfile.findOne({username:req.params.username.toLowerCase()}).lean();if(!bio)return res.status(404).json({message:'Bio page not found'});res.json({bio});}catch(e){next(e)}}
