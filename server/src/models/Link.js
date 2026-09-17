import mongoose from 'mongoose';
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},destinationUrl:{type:String,required:true},shortCode:{type:String,required:true,unique:true,trim:true,index:true},isCustom:{type:Boolean,default:false}},{timestamps:true});
schema.index({userId:1,createdAt:-1});
export default mongoose.model('Link',schema);
