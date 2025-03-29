import puppeteer from "puppeteer";

/**
 * Scrapes the target website and returns structured data
 * @param {string} url - URL to scrape
 * @returns {Promise<Object>} - Scraped data
 */
export async function scrapeWebsite(url) {
  console.log(`Scraping website: ${url}`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the page
    console.log("Navigating to page...");
    await page.goto(url, { waitUntil: "networkidle2" });

    console.log("Page loaded, extracting data...");

    // Example: Extract data from the page
    // Modify this section according to your specific scraping needs
    const data = await page.evaluate(() => {
      const result = {
        title: document.title,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        headings: [],
        paragraphs: [],
      };

      // Extract headings
      document.querySelectorAll("h1, h2, h3").forEach((heading) => {
        result.headings.push({
          type: heading.tagName.toLowerCase(),
          text: heading.innerText.trim(),
        });
      });

      // Extract paragraphs
      document.querySelectorAll("p").forEach((paragraph) => {
        const text = paragraph.innerText.trim();
        if (text.length > 0) {
          result.paragraphs.push(text);
        }
      });

      return result;
    });

    console.log("Data extraction complete");
    return data;
  } catch (error) {
    console.error("Error during scraping:", error);
    throw error;
  } finally {
    await browser.close();
    console.log("Browser closed");
  }
}
