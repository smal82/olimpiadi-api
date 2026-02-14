const express = require('express');
const puppeteer = require('puppeteer');
// Importa il browser fetcher (parte di puppeteer-core o puppeteer)
// NOTA: Se usi puppeteer completo, lo ha già dentro ma a volte serve forzarlo.
const app = express();
const PORT = process.env.PORT || 3000;

// Configurazione cache locale
const { join } = require('path');

app.get('/', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Content-Type', 'application/json');

    console.log("Ricevuta richiesta...");
    let browser = null;

    try {
        console.log("Tentativo avvio browser...");
        
        // Configurazione robusta per Render
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--no-zygote'
            ]
            // Rimuoviamo executablePath per lasciare che Puppeteer cerchi nella sua cache
        });

        const page = await browser.newPage();
        
        // Ottimizzazione estrema
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
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
        
        await page.goto(targetUrl, { 
            waitUntil: 'domcontentloaded', 
            timeout: 50000 
        });

        const content = await page.evaluate(() => document.body.innerText);
        console.log("Dati estratti, lunghezza:", content.length);

        try {
            JSON.parse(content);
            res.send(content);
        } catch(e) {
            res.status(500).json({ error: "Risposta non valida", partial: content.substring(0, 100) });
        }

    } catch (error) {
        console.error("ERRORE PUPPETEER:", error);
        
        // Se l'errore è "Could not find Chromium", diamo un suggerimento nel JSON
        if (error.message.includes("Could not find Chromium")) {
             res.status(500).json({ 
                 error: "Chromium mancante sul server.", 
                 details: "Prova a rieseguire il Deploy su Render con 'Clear Build Cache'." 
             });
        } else {
             res.status(500).json({ error: error.message });
        }
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server avviato su porta ${PORT}`);
});
