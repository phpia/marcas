process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const axios = require('axios');
const LOGIN_URL = "https://sede.oepm.gob.es/eSede/datos/es/catalogo/datos.html?catalogo=marcas#tabs-biblio";
const EMAIL = "daniel@tercerob.com";
const PASSWORD = "pThNcdz0TlXUh";
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path'); 


async function downloadFile(url, downloadPath) {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
  
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(downloadPath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

(async () => {

   // Ruta donde se descargarán los zips
   const downloadPath = path.resolve(__dirname, 'descargas');
   // Crear la carpeta de descargas si no existe
   if (!fs.existsSync(downloadPath)) {
     fs.mkdirSync(downloadPath);
   } 
 
   // Lanzar navegador
   const browser = await puppeteer.launch({
     headless: false, // true para no ver la ventana del navegador
     defaultViewport: null,
     args: ['--no-sandbox', '--disable-setuid-sandbox']
   }); 
 
   // Crear nueva pestaña
   const page = await browser.newPage(); 
 
   // Crear sesión de CDP para configurar el comportamiento de descargas
   const client = await page.target().createCDPSession();
   await client.send('Page.setDownloadBehavior', {
     behavior: 'allow',
     downloadPath: downloadPath
   }); 
 
   console.log("Accediendo a la página de login...");
   await page.goto(LOGIN_URL, { waitUntil: "networkidle2" }); 
 
   // Completar formulario de login (ajusta los selectores según tu página)
   await page.type('input[name="email"]', EMAIL, { delay: 100 });
   await page.type('input[name="password"]', PASSWORD, { delay: 100 });
   await page.click('input[type="submit"]'); 
 
   // Ajustar timeout si fuera necesario
   await page.setDefaultNavigationTimeout(0); 
 
   // Esperar a un texto identificativo para confirmar inicio de sesión
   const targetText = '2019'; // Ajusta según necesites
   await page.waitForFunction(
     text => document.body.innerText.includes(text),
     { timeout: 15000 },
     targetText
   ); 
 
   console.log("Login correcto. Buscando archivos .zip..."); 
 
     // Extract file URLs
  const fileUrls = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href$=".zip"]'))
      .map(a => a.href);
  });

  // Download files using Axios
  for (let url of fileUrls) {
    const fileName = path.basename(url);
    const downloadPath = path.resolve(__dirname, 'downloads', fileName);
    await downloadFile(url, downloadPath);
    console.log(`Downloaded: ${url}`);
  }
   console.log("Todas las descargas han finalizado. Cerrando navegador...");
   await browser.close();
 })(); 