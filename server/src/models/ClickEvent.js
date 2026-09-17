import mongoose from 'mongoose';
const schema=new mongoose.Schema({linkId:{type:mongoose.Schema.Types.ObjectId,ref:'Link',required:true,index:true},timestamp:{type:Date,default:Date.now,index:true},referrer:{type:String,default:'Direct'},deviceType:{type:String,enum:['Mobile','Desktop','Tablet'],required:true},ipHash:{type:String,required:true}},{versionKey:false});
schema.index({linkId:1,timestamp:-1});
export default mongoose.model('ClickEvent',schema);
