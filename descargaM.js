const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { URL } = require('url');

const downloadFile = async (url, folder) => {
    const filename = path.join(folder, path.basename(new URL(url).pathname));
    const response = await fetch(url);
    if (!response.ok) {
        console.log(`Failed to download: ${url}`);
        return;
    }
    
    const fileStream = fs.createWriteStream(filename);
    response.body.pipe(fileStream);
    response.body.on("error", () => console.log(`Error writing file: ${filename}`));
    fileStream.on("finish", () => console.log(`Downloaded: ${filename}`));
};

const downloadOepmFiles = async (folder = "downloads") => {
    const url = "https://sede.oepm.gob.es/eSede/datos/es/catalogo/datos.html?catalogo=marcas#tabs-biblio";
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    
    const response = await fetch(url);
    if (!response.ok) {
        console.log("Failed to fetch the page.");
        return;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    $('a[href]').each((_, element) => {
        const fileUrl = new URL($(element).attr('href'), url).href;
        if (fileUrl.match(/\.(xml|sgml|pdf)$/i)) {
            downloadFile(fileUrl, folder);
        }
    });
};

(async () => {
    await downloadOepmFiles();
})();