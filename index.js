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
        });

        const page = await browser.newPage();
        
        // INTERCETTAZIONE RICHIESTE (TURBO MODE)
        // Blocchiamo immagini, css e font per andare veloci
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if(['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())){
                req.abort();
            } else {
                req.continue();
            }
        });

        const today = new Date().toISOString().split('T')[0];
        const targetUrl = `https://www.olympics.com/wmr-owg2026/schedules/api/ITA/schedule/lite/day/${today}`;
        
        console.log(`Navigazione verso: ${targetUrl}`);

        // Usiamo 'domcontentloaded' invece di networkidle2 che è troppo lento
        await page.goto(targetUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 25000 // Timeout massimo 25s per Puppeteer
        });

        const content = await page.evaluate(() => document.body.innerText);
        
        console.log("Dati estratti, lunghezza:", content.length);
        
        try {
            JSON.parse(content); // Validazione
            res.send(content);
        } catch(e) {
            res.status(500).json({ error: "Risposta non valida", partial: content.substring(0, 100) });
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
