import mongoose from 'mongoose';
const socialSchema=new mongoose.Schema({label:{type:String,required:true},url:{type:String,required:true},platform:{type:String,default:'link'},position:{type:Number,default:0}},{_id:true});
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true},username:{type:String,required:true,unique:true,index:true},displayName:{type:String,default:''},bio:{type:String,default:''},avatar:{type:String,default:''},theme:{type:String,enum:['minimal','slate','gradient'],default:'minimal'},socialLinks:{type:[socialSchema],default:[]}},{timestamps:true});
export default mongoose.model('BioProfile',schema);
