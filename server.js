// 1. Requerimos las herramientas que instalamos
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const path = require('path');

// 2. Configuramos el servidor
const app = express();
const PORT = 3000; // El "puerto" por donde nuestro servidor escuchará

// 3. Servimos los archivos estáticos (nuestro index.html)
// Esto le dice al servidor que la carpeta raíz para los archivos del front-end es la actual '.'
app.use(express.static('.'));

// 4. Configuración de Multer (el manejador de archivos)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Le decimos que guarde los archivos en la carpeta 'uploads'
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Para evitar nombres duplicados, añadimos la fecha y hora al nombre original del archivo
    cb(null, Date.now() + '-' + file.originalname); 
  }
});

const upload = multer({ storage: storage });

// 5. Creamos la "ruta" o "endpoint" para la subida de fotos
// Cuando el front-end envíe una foto a '/upload', este código se ejecutará
app.post('/upload', upload.single('photo'), (req, res) => {
  if (req.file) {
    console.log('¡Foto recibida y guardada!', req.file.path);
    // Enviamos una respuesta exitosa al front-end
    res.json({ success: true, message: '¡Foto subida correctamente!', filePath: req.file.path });
  } else {
    res.status(400).json({ success: false, message: 'Error, no se recibió ninguna foto.' });
  }
});
// ... (todo el código anterior de server.js) ...

const fs = require('fs'); // Módulo para leer archivos del sistema

// 7. Creamos la "ruta" para obtener la lista de fotos
app.get('/photos', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("No se pudo leer el directorio de subidas", err);
      return res.status(500).json([]);
    }
    
    // Filtramos para asegurarnos de que solo sean imágenes y creamos las rutas completas
    const photoPaths = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file))
      .map(file => `uploads/${file}`)
      .reverse(); // Para que las más nuevas aparezcan primero
      
    res.json(photoPaths);
  });
});



// 6. Ponemos el servidor a escuchar peticiones
app.listen(PORT, () => {
  console.log(`¡Servidor funcionando! Abre tu navegador en http://localhost:${PORT}`);
});