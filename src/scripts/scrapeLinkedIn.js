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
const { linkedinLogin } = require("../utils/login");

/**
 * Scrape LinkedIn to find active users for a given company
 * @param {{email: string, password: string, company: string}} data An object with login credentials and the company's LinkedIn handle
 */
const scrapeLinkedIn = async (data) => {
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
    // await checkCookies(page, data);

    try {
      //Visit LinkedIn
      await page.goto(`https://www.linkedin.com/`);

      //Login to your account
      const checkLogin = await linkedinLogin(
        data.username,
        data.password,
        page
      );

      if (!checkLogin) {
        await browser.close();

        return false;
      }

      //Visit the company's page and find the list of employees
      await page.goto(`https://www.linkedin.com/company/${data.company}`, {
        waitUntil: waitUntilOptions,
      });

      //Visit all employees from the company's page
      const linkInSide = await page.$(
        "a.ember-view.org-top-card-secondary-content__see-all-link"
      );

      if (!linkInSide) {
        const divElement = await page.$(
          "div.org-top-card-secondary-content__see-all-independent-link"
        );

        const anchorElement = await divElement.$("a.ember-view");

        await anchorElement.click();
      } else {
        linkInSide.click();
      }
    } catch (e) {
      console.log(
        "Oops! An error occured while trying to find the company's page." +
          "\n" +
          "The reason for this error can be either the browser was closed while execution or you entered invalid data in env file." +
          "\n" +
          "Please check the LinkedIn handle of the company you're trying to find and your credentials and try again."
      );
      await browser.close();

      return false;
    }

    await page.waitForNavigation();

    //Fetch all profile links
    const profileLinks = await fetchProfileLinks(page, data.page);

    //Visit activity page and filter the list of active employees
    const activeEmployeesObservable = await fetchEachProfileActivityInParallel(
      page,
      profileLinks,
      waitUntilOptions
    );
    const activeEmployees = await rxjs.lastValueFrom(activeEmployeesObservable);

    //Save profiles to a file
    // saveProfiles(activeEmployees);

    // const browser = await puppeteer.launch();
    await connectWithId(page, activeEmployees);

    await browser.close();

    return activeEmployees;
  } catch (err) {
    console.error("Oops! An error occured.");
    console.error(err);
    await browser.close();
    return false;
  }
};

module.exports = {
  scrapeLinkedIn,
};
