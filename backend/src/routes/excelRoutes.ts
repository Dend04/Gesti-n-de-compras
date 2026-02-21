import { Router } from 'express';
import upload from '../middlewares/uploadMiddleware';
import { uploadAndConvert } from '../controllers/excelController';

const router = Router();

router.post('/convert', upload.single('excelFile'), uploadAndConvert);

export default router;