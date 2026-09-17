import rateLimit from 'express-rate-limit';
export const authLimiter=rateLimit({windowMs:15*60*1000,max:30,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many authentication attempts. Try again later.'}});
export const createLimiter=rateLimit({windowMs:60*1000,max:30,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many link creation requests.'}});
export const redirectLimiter=rateLimit({windowMs:60*1000,max:120,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Too many redirect requests.'}});
