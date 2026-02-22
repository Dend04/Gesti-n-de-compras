import { Router } from 'express';
import upload from '../middlewares/uploadMiddleware';
import { uploadAndConvert, createTicket, downloadFormattedExcel, downloadSinStockExcel } from '../controllers/excelController';

const router = Router();

router.post('/convert', upload.single('excelFile'), uploadAndConvert);
router.post('/create-ticket', upload.fields([{ name: 'excelFile', maxCount: 1 }, { name: 'csvFile', maxCount: 1 }]), createTicket);
router.post('/download-formatted', downloadFormattedExcel);
router.post('/download-sinstock', downloadSinStockExcel);

export default router;