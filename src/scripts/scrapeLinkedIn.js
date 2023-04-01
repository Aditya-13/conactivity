const {
  fetchEachProfileActivityInParallel,
} = require("./fetchProfileActivity");
const puppeteer = require("puppeteer");
const fs = require("fs");
const rxjs = require("rxjs");
const path = require("node:path");
const connectWithId = require("../utils/connect");
const { checkCookies } = require("../utils/cookies");
const { fetchProfileLinks } = require("./fetchProfileLinks");
const { saveProfiles } = require("./saveProfiles");

/**
 * Scrape LinkedIn to find active users for a given company
 * @param {{email: string, password: string, company: string}} data An object with login credentials and the company's LinkedIn handle
 */
const scrapeLinkedIn = async (data) => {
  const outputPath = path.join(__dirname, "../../output/");

  let isOutputExist = fs.readdirSync(outputPath);

  //Launch a chromium automated session
  const browser = await puppeteer.launch({
    headless: false,
    dumpio: true,
    args: ["--no-sandbox"],
  });

  const waitUntilOptions = ["domcontentloaded", "networkidle2"];

  try {
    //Open a new tab
    const [page] = await browser.pages();

    //Page configurations
    // await page.setViewport({ width: `full`, height: `full` });
    page.setDefaultNavigationTimeout(0);

    //check cookies
    await checkCookies(page, data);

    // if (!isOutputExist.length) {
    try {
      //Visit the company's page and find the list of employees
      await page.goto(`https://www.linkedin.com/company/${data.company}`, {
        waitUntil: waitUntilOptions,
      });

      //Visit all employees from the company's page
      await page.click(
        "a.ember-view.org-top-card-secondary-content__see-all-link"
      );
    } catch (e) {
      console.error(
        "Oops! An error occured while trying to find the company's page." +
          "\n" +
          "The reason for this error can be either the browser was closed while execution or you entered invalid data in env file." +
          "\n" +
          "Please check the LinkedIn handle of the company you're trying to find and your credentials and try again."
      );
      await browser.close();
    }

    await page.waitForNavigation();

    //Fetch all profile links
    const profileLinks = await fetchProfileLinks(page, 1);

    //Visit activity page and filter the list of active employees
    const activeEmployeesObservable = await fetchEachProfileActivityInParallel(
      page,
      profileLinks,
      waitUntilOptions
    );
    const activeEmployees = await rxjs.lastValueFrom(activeEmployeesObservable);
    console.log("Active users : ", activeEmployees);

    //Save profiles to a file
    saveProfiles(activeEmployees);

    // const browser = await puppeteer.launch();
    await connectWithId(page, activeEmployees);

    await browser.close();
    // } else {
    //   fs.readdir(outputPath, async function (err, files) {
    //     if (err) {
    //       console.log("Error getting directory information.");
    //     } else {
    //       // Filter out subdirectories
    //       files = files.filter(function (file) {
    //         return fs.statSync(outputPath + file).isFile();
    //       });

    //       // Sort files by modification time, most recent first
    //       files.sort(function (a, b) {
    //         return (
    //           fs.statSync(outputPath + b).mtime.getTime() -
    //           fs.statSync(outputPath + a).mtime.getTime()
    //         );
    //       });

    //       // Read content of most recent file
    //       const filePath = outputPath + files[0];
    //       const fileContent = fs.readFileSync(filePath, "utf-8");

    //       // Parse JSON and access "activeProfiles" property
    //       const jsonData = JSON.parse(fileContent);
    //       const activeProfiles = [
    //         "https://www.linkedin.com/in/rohan-ahuja-49936516a",
    //       ];

    //       // Launch a new instance of a browser
    //       const browser = await puppeteer.launch();
    //       connectWithId(page, activeProfiles);
    //       await browser.close();
    //     }
    //   });
    // }
  } catch (err) {
    console.error("Oops! An error occured.");
    console.error(err);
    await browser.close();
  }
};

module.exports = {
  scrapeLinkedIn,
};
