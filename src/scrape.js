//Imports
const puppeteer = require("puppeteer");
const jsonfile = require("jsonfile");
const fs = require("fs");
const path = require("node:path");
const rxjs = require("rxjs");
const { mergeMap, toArray, filter } = require("rxjs/operators");
require("dotenv").config();

/**
 * Automated login to LinkedIn
 * @param {string} username User email
 * @param {string} password User password
 */
const linkedinLogin = async (username, password, page) => {
  console.log(`Logging in with email: ${process.env.EMAIL}`);

  await page.type("#session_key", username);
  await page.type("#session_password", password);
  await page.click(".sign-in-form__submit-btn--full-width");

  // Wait for page load
  return new Promise((resolve) => {
    page.on("framenavigated", async () => {
      if (page.url().startsWith("https://www.linkedin.com/feed")) {
        // Save the session cookies
        const cookiesObject = await page.cookies();
        // Store cookies in cookie.json to persist the session
        jsonfile.writeFile(
          "../cookie.json",
          cookiesObject,
          { spaces: 2 },
          (err) => {
            if (err) console.log("Error while writing file: ", err);
            else console.log("Session saved successfully!");
          }
        );
        return resolve();
      }
    });
  });
};

/**
 * Automating scroll inside a page
 * @param {Promise} page Promise of Browser page
 */
const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};

/**
 * Fetch all profile links
 * @param {Promise} page Promise of Browser page
 * @param {Number} pagesToVisit Specifies the number of page to scrape (defaults to 2)
 */
const fetchProfileLinks = async (page, pagesToVisit = 2) => {
  let profileLinks = [];

  for (let pageNumber = 0; pageNumber < pagesToVisit; pageNumber++) {
    await autoScroll(page);

    //Fetch all profile links from the page
    profileLinks.push(
      ...(await page.evaluate(() => {
        //Multiple selectors for different displays of LinkedIn(see issue #20)
        const profileListSelectors = [
          ".search-results-container .search-result__result-link",
          ".reusable-search__entity-result-list .entity-result__title-line a",
        ];
        let profileListNodes = null;
        for (
          let profileListSelectorIndex = 0;
          profileListSelectorIndex < profileListSelectors.length;
          profileListSelectorIndex++
        ) {
          //Break the loop where profile selector matches
          if (
            document.querySelectorAll(
              profileListSelectors[profileListSelectorIndex]
            ).length > 0
          ) {
            profileListNodes = document.querySelectorAll(
              profileListSelectors[profileListSelectorIndex]
            );
            break;
          }
        }
        if (profileListNodes) {
          //Store and return profile links from nodes
          let profiles = [];
          profileListNodes.forEach((profile) => {
            if (profile.href) {
              // Remove query params from URL
              profiles.push(profile.href.split("?")[0]);
            }
          });
          return profiles;
        }
      }))
    );

    if (pageNumber < pagesToVisit - 1) {
      //Click on next button on the bottom of the profiles page
      await page.click(
        ".artdeco-pagination__button.artdeco-pagination__button--next"
      );
      await page.waitForNavigation();
    }
  }
  return profileLinks;
};

/**
 * Filter and return active employees (any activity withing 1 week)
 * from all employees by visiting their activity page
 * @param {Promise} page Promise of Browser page
 * @param {Array.<String>} profileLinks A list of scraped profile links
 * @param {Array.<String>} waitUntilOptions Puppeteer options
 * @param {Number} numOfParallelTabs Number of profiles to visit in parallel tabs
 */
const fetchEachProfileActivityInParallel = async (
  page,
  profileLinks,
  waitUntilOptions,
  numOfParallelTabs = 1
) => {
  return rxjs.from(profileLinks).pipe(
    mergeMap(async (profileLink) => {
      await page.goto(profileLink + "/recent-activity", {
        waitUntil: "load",
      });

      //Find time of last activities of a user(likes, comments, posts)
      const individualActivities = await page.evaluate(async () => {
        return new Promise((resolve, reject) => {
          let timeOfActivity = [];

          const timeSelector =
            "div.feed-shared-update-v2.feed-shared-update-v2--minimal-padding.full-height.relative.feed-shared-update-v2--e2e.artdeco-card span.update-components-actor__sub-description.t-12.t-normal.t-black--light span.visually-hidden";
          if (document.querySelectorAll(timeSelector)) {
            document.querySelectorAll(timeSelector).forEach((item) => {
              if (item.innerHTML) {
                //Log all user activity within a week
                if (item.innerHTML.match(/[0-9](m?|h?|d?|w) /)) {
                  timeOfActivity.push(item.innerHTML);
                }
              }
            });
          }
          resolve(timeOfActivity);
        });
      });

      //Return links to active employees
      if (individualActivities.length) {
        return profileLink;
      } else {
        return null;
      }
    }, numOfParallelTabs),
    filter((profileLink) => !!profileLink),
    toArray()
  );
};

/**
 * Save profile links to a JSON file
 * @param {Array.<String>} activeEmployees List of active employees
 */
const saveProfiles = (activeEmployees) => {
  const time = Date.now();
  const fileName = `../output/${process.env.COMPANY}${time}.json`; // generate the a unique fileName for each run of the script

  //Save all active employee profiles to a file
  if (!fs.existsSync("../output")) {
    // check for existing output directory, create it if necessary
    fs.mkdirSync("../output");
  }

  const output = { activeProfiles: activeEmployees };
  fs.appendFile(fileName, JSON.stringify(output, null, "\t"), (err) => {
    if (err) throw err;
  });
};

/**
 * Scrape LinkedIn to find active users for a given company
 * @param {{email: string, password: string, company: string}} data An object with login credentials and the company's LinkedIn handle
 */
const scrapeLinkedIn = async (data) => {
  const outputPath = path.join(__dirname, "../output/");
  let isOutputExist = fs.readdirSync(outputPath).length;

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

    //Check if cookies are stored in cookie.json and use that data to skip login
    const previousSession = fs.existsSync("../cookie.json");
    if (previousSession) {
      //Load the cookies
      const cookiesArr = require(`..${"/cookie.json"}`);
      if (cookiesArr.length !== 0) {
        //Set each browser cookie
        for (let cookie of cookiesArr) {
          await page.setCookie(cookie);
        }
        console.log("Previous session loaded successfully!");
      }
    } else {
      //Visit LinkedIn
      await page.goto(`https://www.linkedin.com/`);

      //Login to your account
      await linkedinLogin(data.username, data.password, page);
    }

    if (!isOutputExist) {
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
      const profileLinks = await fetchProfileLinks(page, 5);

      //Visit activity page and filter the list of active employees
      const activeEmployeesObservable = await fetchEachProfileActivityInParallel(
        page,
        profileLinks,
        waitUntilOptions
      );
      const activeEmployees = await rxjs.lastValueFrom(
        activeEmployeesObservable
      );
      console.log("Active users : ", activeEmployees);

      //Save profiles to a file
      saveProfiles(activeEmployees);

      await browser.close();
    } else {
      fs.readdir(outputPath, async function (err, files) {
        if (err) {
          console.log("Error getting directory information.");
        } else {
          // Filter out subdirectories
          files = files.filter(function (file) {
            return fs.statSync(outputPath + file).isFile();
          });

          // Sort files by modification time, most recent first
          files.sort(function (a, b) {
            return (
              fs.statSync(outputPath + b).mtime.getTime() -
              fs.statSync(outputPath + a).mtime.getTime()
            );
          });

          // Read content of most recent file
          const filePath = outputPath + files[0];
          const fileContent = fs.readFileSync(filePath, "utf-8");

          // Parse JSON and access "activeProfiles" property
          const jsonData = JSON.parse(fileContent);
          const activeProfiles = jsonData.activeProfiles;

          // Launch a new instance of a browser
          const browser = await puppeteer.launch();

          // Loop through each link and open a new page
          for (const link of activeProfiles) {
            await page.goto(link, {
              waitUntil: "load",
            });
          }

          await browser.close();
        }
      });
    }
  } catch (err) {
    console.error("Oops! An error occured.");
    console.error(err);
    await browser.close();
  }
};

scrapeLinkedIn({
  username: process.env.EMAIL,
  password: process.env.PASSWORD,
  company: process.env.COMPANY,
});
