require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURACIÓN DE SEGURIDAD ---
const ADMIN_PASSWORD = "bubito"; // Contraseña para subir y borrar

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración del almacenamiento con Multer y Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'galeria-amorcito',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());

// --- RUTAS DE LA API ---

// Ruta para subir una foto (CON VERIFICACIÓN DE CONTRASEÑA)
app.post('/upload', upload.single('photo'), async (req, res) => {
    // 1. Verificamos la contraseña que llega desde el formulario
    const { password } = req.body;

    if (password !== ADMIN_PASSWORD) {
        // Si la contraseña es incorrecta, borramos la foto que se acaba de subir
        if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        return res.json({ success: false, message: 'Contraseña incorrecta. No se guardó la foto.' });
    }

    // 2. Si la contraseña es correcta y hay archivo
    if (req.file) {
        res.json({ success: true, message: '¡Foto subida correctamente!', filePath: req.file.path });
    } else {
        res.status(400).json({ success: false, message: 'Error, no se recibió ninguna foto.' });
    }
});

// Ruta para obtener todas las fotos
app.get('/photos', async (req, res) => {
    try {
        const { resources } = await cloudinary.search
            .expression('folder:galeria-amorcito')
            .sort_by('created_at', 'desc')
            .max_results(500)
            .execute();
        
        const photoUrls = resources.map(file => file.secure_url);
        res.json(photoUrls);
    } catch (error) {
        console.error('Error al obtener fotos de Cloudinary:', error);
        res.status(500).json([]);
    }
});

// Ruta para eliminar fotos
app.delete('/delete/:filename', async (req, res) => {
    const { filename } = req.params;
    const { password } = req.body;

    // 1. Verificamos la contraseña
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: 'Contraseña incorrecta.' });
    }

    try {
        // 2. Construimos el ID público y borramos
        const public_id = `galeria-amorcito/${path.parse(filename).name}`;
        await cloudinary.uploader.destroy(public_id);
        
        res.json({ success: true, message: 'Foto eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar foto de Cloudinary:', error);
        res.status(500).json({ success: false, message: 'El archivo no se pudo eliminar del servidor.' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
