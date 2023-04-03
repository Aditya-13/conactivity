const jsonfile = require("jsonfile");
const path = require("node:path");

/**
 * Automated login to LinkedIn
 * @param {string} username User email
 * @param {string} password User password
 */

const linkedinLogin = async (username, password, page) => {
  console.log(`Logging in with email: ${username}`);

  try {
    await page.type("#session_key", username);
    await page.type("#session_password", password);
    await page.click(".sign-in-form__submit-btn--full-width");

    // Wait for page load
    await page.waitForNavigation({
      waitUntil: "load",
    });
    if (page.url().startsWith("https://www.linkedin.com/feed")) {
      return true;
      // Save the session cookies
      // const cookiesObject = await page.cookies();
      // Store cookies in cookie.json to persist the session
      // jsonfile.writeFile(
      //   path.join(__dirname, "../../cookie.json"),
      //   cookiesObject,
      //   { spaces: 2 },
      //   (err) => {
      //     if (err) console.log("Error while writing file: ", err);
      //     else console.log("Session saved successfully!");
      //   }
      // );
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

module.exports = {
  linkedinLogin,
};
