const { autoScroll } = require("./autoScroll");

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

module.exports = {
  fetchProfileLinks,
};
