const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'application/json');

    console.log("Ricevuta richiesta...");

    let browser = null;
    try {
        console.log("Avvio Browser...");
        
        // Configurazione specifica per Render + Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', 
                '--disable-gpu'
            ]
            // NOTA: Non mettiamo executablePath. Lasciamo che Puppeteer usi quello
            // che ha scaricato in .cache durante npm install
        });

        const page = await browser.newPage();
        
        // Timeout generoso
        page.setDefaultNavigationTimeout(60000);

        // User Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        // URL Olimpiadi
        const today = new Date().toISOString().split('T')[0];
        const targetUrl = `https://www.olympics.com/wmr-owg2026/schedules/api/ITA/schedule/lite/day/${today}`;

        console.log(`Navigazione verso: ${targetUrl}`);

        // Vai alla pagina
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

        // Prendi il testo
        const content = await page.evaluate(() => document.body.innerText);

        console.log("Dati estratti, lunghezza:", content.length);

        try {
            JSON.parse(content);
            res.send(content);
        } catch (e) {
            console.error("Non è JSON:", content.substring(0, 100));
            res.status(500).json({ error: "Risposta non valida", partial: content.substring(0, 200) });
        }

    } catch (error) {
        console.error("Errore:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server avviato su porta ${PORT}`);
});
