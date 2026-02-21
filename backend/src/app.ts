import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import excelRoutes from './routes/excelRoutes';
import fs from 'fs';
import path from 'path';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/excel', excelRoutes);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Carpeta uploads creada');
}

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});