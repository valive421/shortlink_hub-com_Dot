import mongoose from 'mongoose';
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},tokenHash:{type:String,required:true,unique:true},jti:{type:String,required:true,index:true},expiresAt:{type:Date,required:true},revokedAt:{type:Date,default:null}},{timestamps:true});
schema.index({expiresAt:1},{expireAfterSeconds:0});
export default mongoose.model('RefreshToken',schema);
