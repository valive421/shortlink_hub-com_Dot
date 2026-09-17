import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import Link from '../models/Link.js';
import ClickEvent from '../models/ClickEvent.js';
import { hashIp } from '../utils/ip.js';
import { getDeviceType } from '../utils/device.js';
const generate=customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',6);
const createSchema=z.object({destinationUrl:z.string().url(),shortCode:z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/).optional()});
export async function createLink(req,res,next){try{
 const data=createSchema.parse(req.body); let shortCode=data.shortCode||generate();
 if(await Link.exists({shortCode}))return res.status(409).json({message:'Short code already exists'});
 const link=await Link.create({userId:req.user.sub,destinationUrl:data.destinationUrl,shortCode,isCustom:Boolean(data.shortCode)});
 res.status(201).json({link});
}catch(e){next(e)}}
export async function listLinks(req,res,next){try{
 const page=Math.max(1,Number(req.query.page)||1), limit=Math.min(50,Math.max(1,Number(req.query.limit)||10)), search=(req.query.search||'').trim();
 const filter={userId:req.user.sub}; if(search)filter.$or=[{destinationUrl:{$regex:search,$options:'i'}},{shortCode:{$regex:search,$options:'i'}}];
 const [items,total]=await Promise.all([Link.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),Link.countDocuments(filter)]);
 res.json({items,total,page,limit,pages:Math.ceil(total/limit)});
}catch(e){next(e)}}
export async function getLink(req,res,next){try{const link=await Link.findOne({_id:req.params.id,userId:req.user.sub});if(!link)return res.status(404).json({message:'Link not found'});res.json({link});}catch(e){next(e)}}
export async function deleteLink(req,res,next){try{const link=await Link.findOneAndDelete({_id:req.params.id,userId:req.user.sub});if(!link)return res.status(404).json({message:'Link not found'});await ClickEvent.deleteMany({linkId:link._id});res.json({message:'Link deleted'});}catch(e){next(e)}}
export async function redirect(req,res,next){try{
 const link=await Link.findOne({shortCode:req.params.shortCode}).lean(); if(!link)return res.status(404).send('Short link not found');
 const event={linkId:link._id,timestamp:new Date(),referrer:req.get('referer')||'Direct',deviceType:getDeviceType(req.get('user-agent')),ipHash:hashIp(req.ip)};
 ClickEvent.create(event).catch(err=>console.error('click event failed',err)); res.redirect(302,link.destinationUrl);
}catch(e){next(e)}}
export async function analytics(req,res,next){try{
 const link=await Link.findOne({_id:req.params.id,userId:req.user.sub}).lean(); if(!link)return res.status(404).json({message:'Link not found'});
 const [total,byDevice,byReferrer,overTime]=await Promise.all([
  ClickEvent.countDocuments({linkId:link._id}),
  ClickEvent.aggregate([{$match:{linkId:link._id}},{$group:{_id:'$deviceType',clicks:{$sum:1}}},{$project:{_id:0,device:'$_id',clicks:1}},{$sort:{clicks:-1}}]),
  ClickEvent.aggregate([{$match:{linkId:link._id}},{$group:{_id:'$referrer',clicks:{$sum:1}}},{$project:{_id:0,referrer:'$_id',clicks:1}},{$sort:{clicks:-1}},{$limit:10}]),
  ClickEvent.aggregate([{$match:{linkId:link._id}},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$timestamp'}},clicks:{$sum:1}}},{$project:{_id:0,date:'$_id',clicks:1}},{$sort:{date:1}},{$limit:30}])
 ]); res.json({link,total,byDevice,byReferrer,overTime});
}catch(e){next(e)}}
