import crypto from 'node:crypto';
export function hashIp(ip){ return crypto.createHash('sha256').update(`${ip}:${process.env.JWT_ACCESS_SECRET}`).digest('hex'); }
