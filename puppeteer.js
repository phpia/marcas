const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const LOGIN_URL = "https://sede.oepm.gob.es/eSede/datos/es/catalogo/datos.html?catalogo=marcas#tabs-biblio";
const DOWNLOAD_FOLDER = path.join(__dirname, "downloads");

const email = "daniel@tercerob.com";
const PASSWORD = "pThNcdz0TlXUh";

async function loginAndGetLinks() {
    const browser = await puppeteer.launch({ headless: false }); // Para ver el navegador
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log("Accediendo a la página de login...");
    await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

    // Aquí se debe identificar el formulario de login de la web (ajustar si es necesario)
    await page.type('input[name="email"]', email, { delay: 100 });
    await page.type('input[name="password"]', PASSWORD, { delay: 100 });
    await page.click('input[type="submit"]');

    await page.setDefaultNavigationTimeout(0);
    await page.goto('https://sede.oepm.gob.es/eSede/datos/es/catalogo/datos.html?catalogo=marcas#tabs-biblio', {
        waitUntil: 'domcontentloaded'
    });
    

    console.log("Inicio de sesión exitoso, extrayendo enlaces...");

    // Extraer enlaces de archivos ZIP
    const zipLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href$=".zip"]'))
            .map(a => a.href);
    });

    console.log(`Encontrados ${zipLinks.length} archivos ZIP.`);
    await browser.close();
    return zipLinks;
}

async function downloadFile(url, folder) {
    const filename = path.join(folder, path.basename(url));
    console.log(`Descargando: ${url}...`);

    const response = await fetch(url);
    if (!response.ok) {
        console.error(`Error al descargar: ${url}`);
        return;
    }

    const fileStream = fs.createWriteStream(filename);
    response.body.pipe(fileStream);
    response.body.on("error", (err) => console.error(`Error escribiendo archivo: ${err.message}`));
    fileStream.on("finish", () => console.log(`Descargado: ${filename}`));
}

async function downloadAllFiles() {
    if (!fs.existsSync(DOWNLOAD_FOLDER)) {
        fs.mkdirSync(DOWNLOAD_FOLDER, { recursive: true });
    }

    const zipLinks = await loginAndGetLinks();
    for (const link of zipLinks) {
        await downloadFile(link, DOWNLOAD_FOLDER);
    }
}

downloadAllFiles();
