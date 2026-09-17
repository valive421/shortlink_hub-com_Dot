import {Router} from 'express';
import {getMine,upsertMine,getPublic} from '../controllers/bioController.js';
import {requireAuth} from '../middleware/auth.js';
const r=Router();r.get('/me',requireAuth,getMine);r.put('/me',requireAuth,upsertMine);r.get('/:username',getPublic);export default r;
