const { findConnectBtn } = require("./connectBtn");
const { alreadySentfn } = require("./selectors/allSelectors");

async function connectWithId(page, activeProfiles) {
  // Loop through each link and open a new page
  for (const link of activeProfiles) {
    await page.goto(link, {
      waitUntil: "load",
    });

    let name = await page.evaluate(async () => {
      const nameSelector =
        "h1.text-heading-xlarge.inline.t-24.v-align-middle.break-words";

      if (document.querySelector(nameSelector)) {
        let nameOfPerson = document.querySelector(nameSelector).innerHTML;
        return nameOfPerson;
      }
    });

    const alreadySent = await alreadySentfn(page, name);

    if (alreadySent.length) {
      continue;
    }

    const sendRequest = await findConnectBtn(page, name);

    if (sendRequest) {
      recordOfSent.push(link);
    } else {
      continue;
    }
  }
}

module.exports = connectWithId;
