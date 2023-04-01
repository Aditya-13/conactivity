const { linkedinLogin } = require("../utils/login");
const fs = require("fs");
const path = require("node:path");

//Check if cookies are stored in cookie.json and use that data to skip login

async function checkCookies(page, data) {
  const previousSession = fs.existsSync(
    path.join(__dirname, "../../cookie.json")
  );

  if (previousSession) {
    //Load the cookies
    const cookiesArr = require("../../cookie.json");

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
}

module.exports = {
  checkCookies,
};
