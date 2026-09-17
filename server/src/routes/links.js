import {Router} from 'express';
import {createLink,listLinks,getLink,deleteLink,analytics} from '../controllers/linkController.js';
import {requireAuth} from '../middleware/auth.js';
import {createLimiter} from '../middleware/rateLimit.js';
const r=Router();r.use(requireAuth);r.get('/',listLinks);r.post('/',createLimiter,createLink);r.get('/:id',getLink);r.get('/:id/analytics',analytics);r.delete('/:id',deleteLink);export default r;
