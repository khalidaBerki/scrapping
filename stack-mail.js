import puppeteer from 'puppeteer';
import { Resend } from 'resend';

// Créer un transporteur SMTP avec les informations fournies par resend.com
const resend = new Resend('ajoute ta clé resend ici');

async function sendEmail(subject, body) {
    try {
        const response = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'tomail@gmail.com', // Votre propre adresse e-mail
            subject: subject,
            html: body // Utilisez le corps HTML de l'e-mail
        });
        console.log('Email envoyé avec succès:', response);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
    }
}

async function scrapingStackOverflow(searchQuery, tags) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        await page.goto('https://stackoverflow.com/questions/tagged/' + tags);
        await page.setViewport({ width: 1080, height: 1024 });

        await page.type('.js-search-field', searchQuery);
        await page.keyboard.press('Enter');
        await page.waitForNavigation();

        console.log('Résultats du scraping Stack Overflow :');

        const questionSelector = '.question-hyperlink';
        const questions = [];

        await page.waitForSelector(questionSelector);
        const questionLinks = await page.$$eval(questionSelector, links => links.map(link => link.href));
        const questionTitles = await page.$$eval(questionSelector, titles => titles.map(title => title.textContent.trim()));

        // Construire le corps de l'e-mail avec les résultats du scraping
        let emailBody = 'Résultats du scraping Stack Overflow :\n\n';
        questionLinks.forEach((link, index) => {
            const title = questionTitles[index];
            emailBody += `${index + 1}. Titre : ${title} | Lien : ${link}\n`;
        });

        // Envoyer l'e-mail
        await sendEmail('Résultats du scraping Stack Overflow', emailBody);

    } catch (error) {
        console.error("Une erreur s'est produite : ", error);
    } finally {
        await browser.close();
    }
}

// Lecture des critères de recherche à partir de l'entrée standard (terminal)
process.stdin.setEncoding('utf8');
console.log('Entrez le terme de recherche sur Stack Overflow :');
process.stdin.on('data', async (searchQuery) => {
    searchQuery = searchQuery.trim();
    if (searchQuery === 'exit') {
        process.exit();
    } else {
        console.log('Entrez les tags (séparés par des espaces) :');
        process.stdin.once('data', async (tags) => {
            tags = tags.trim().replace(/\s+/g, '-'); // Remplacer les espaces par des tirets pour l'URL
            await scrapingStackOverflow(searchQuery, tags);
        });
    }
});
