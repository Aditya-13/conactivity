const fs = require("fs");
const path = require("node:path");
require("dotenv").config();

/**
 * Save profile links to a JSON file
 * @param {Array.<String>} activeEmployees List of active employees
 */
const saveProfiles = (activeEmployees) => {
  const time = Date.now();
  const fileName = path.join(
    __dirname,
    `../../output/${process.env.COMPANY}${time}.json`
  ); // generate the a unique fileName for each run of the script

  //Save all active employee profiles to a file
  if (!fs.existsSync(path.join(__dirname, "../../output"))) {
    // check for existing output directory, create it if necessary
    fs.mkdirSync(path.join(__dirname, "../../output"));
  }

  const output = { activeProfiles: activeEmployees };

  fs.appendFile(fileName, JSON.stringify(output, null, "\t"), (err) => {
    if (err) throw err;
  });
};

module.exports = {
  saveProfiles,
};
