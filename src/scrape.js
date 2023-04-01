//Imports
const { scrapeLinkedIn } = require("./scripts/scrapeLinkedIn");
require("dotenv").config();

scrapeLinkedIn({
  username: process.env.EMAIL,
  password: process.env.PASSWORD,
  company: process.env.COMPANY,
});
