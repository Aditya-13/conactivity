const { mergeMap, toArray, filter } = require("rxjs/operators");
const rxjs = require("rxjs");

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

module.exports = {
  fetchEachProfileActivityInParallel,
};
