import { scrapeWebsite } from "./scraper.js";
import { XMLParser } from "fast-xml-parser";
import dotenv from "dotenv";
import { sendAnnouncementToDiscord } from "./discord.js";
import { sendSimpleMessage } from "./email.js";
dotenv.config();
const bangorXml =
  '<?xml version="1.0" encoding="utf-8" ?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">     <soap:Body>         <getRoundCalendarForUPRN xmlns="http://webaspx-collections.azurewebsites.net/">             <council>ArdsAndNorthDown</council>             <UPRN>187375731</UPRN>             <from>Chtml</from>         </getRoundCalendarForUPRN>     </soap:Body></soap:Envelope>';

async function main() {
  try {
    const timestamp = new Date().toISOString();
    console.log(`Scraping started at: ${timestamp}`);

    // Run the scraper
    // const data = await scrapeWebsite("https://example.com");
    const data = await fetchBins();
    const notification = data
      .map((d) => `${d.label}: ${d.formatted}`)
      .join("\n");
    const fin = await sendAnnouncementToDiscord(notification);
    const emailResp = await sendSimpleMessage(
      `${data[0].label} - ${data[0].formatted}`,
      notification
    );
    // Log the data to console
    console.log("Scraping completed. Data:");
    console.log(notification);
    process.exit(0);
  } catch (error) {
    console.error("Error in scraping process:", error);
    process.exit(1);
  }
}

// Execute if this is the main module
if (import.meta.url === import.meta.main) {
  main();
} else {
  // When imported by another module
  main();
}

async function fetchBins() {
  const resp = await fetch(
    "https://collections-ardsandnorthdown.azurewebsites.net/WSCollExternal.asmx",
    {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,zh-HK;q=0.8,zh;q=0.7",
        "cache-control": "no-cache",
        "content-type": "text/xml; charset=UTF-8",
        pragma: "no-cache",
        "sec-ch-ua":
          '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie:
          "ARRAffinitySameSite=5543da8d48c6820d53807a48e39a542154b65b075e25f2b10cb24b1447a1372e",
        Referer:
          "https://collections-ardsandnorthdown.azurewebsites.net/calendar.html",
        "Referrer-Policy": "same-origin",
      },
      body: bangorXml,
      method: "POST",
    }
  );
  const text = await resp.text();

  const parser = new XMLParser();
  let jObj = parser.parse(text);
  const result =
    jObj["soap:Envelope"]["soap:Body"]["getRoundCalendarForUPRNResponse"][
      "getRoundCalendarForUPRNResult"
    ];
  const parsed = result.split("<img")[0].split("<br>");
  const mappedResult = parsed.map(extractBinInfo).filter(Boolean);

  // Sort by nearest date
  mappedResult.sort((a, b) => a.date - b.date);

  return mappedResult;
}

import { parse, format, differenceInCalendarDays } from "date-fns";

const formatRelativeDate = (dateString) => {
  const parsedDate = parse(dateString, "EEE d MMM", new Date());
  const daysDiff = differenceInCalendarDays(parsedDate, new Date());

  let relativeText =
    daysDiff === 0
      ? "today"
      : daysDiff === 1
      ? "tomorrow"
      : daysDiff > 1
      ? `${daysDiff} days from now`
      : `${Math.abs(daysDiff)} days ago`;

  return {
    formatted: `${format(parsedDate, "EEEE")}, ${relativeText}`,
    date: parsedDate,
  };
};

const extractBinInfo = (text) => {
  const labelMatch = text.match(/<b>(.*?)<\/b>/);
  const dateMatch = text.match(/(\w{3}) (\d{1,2}) (\w{3})/);

  if (labelMatch && dateMatch) {
    const label = labelMatch[1];
    const [, day, date, month] = dateMatch;
    const { formatted, date: parsedDate } = formatRelativeDate(
      `${day} ${date} ${month}`
    );

    return { label, formatted, date: parsedDate };
  }
  return null;
};
