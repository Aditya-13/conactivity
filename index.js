const express = require("express");
const path = require("node:path");
const bodyParser = require("body-parser");
const { scrapeLinkedIn } = require("./src/scripts/scrapeLinkedIn");

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, "public")));
// app.use(express.json());

app.get("/", (req, res) => {
  const companies = [
    "walmart",
    "amazon",
    "Apple",
    "google",
    "cvs-health",
    "unitedhealth-group",
    "exxonmobil",
    "berkshire-hathaway",
    "bank-of-america",
    "costco-wholesale",
    "cignahealthcare",
    "att",
    "amerisourcebergen",
    "microsoft",
    "cardinal-health",
    "chevron",
    "verizon",
    "mckesson",
    "jpmorganchase",
    "general-motors",
    "johnson-&-johnson",
    "delltechnologies",
    "meta",
    "fedex",
    "pfizer",
    "citigroup",
    "pepsico",
    "adidas",
    "nike",
    "ibm",
    "intel-corporation",
    "hp",
    "netflix",
    "adobe",
    "boeing",
    "oracle",
    "morgan-stanley",
    "tesla-motors",
    "american-express",
    "goldman-sachs",
    "the-coca-cola-company",
    "qualcomm",
    "starbucks",
    "visa",
    "nvidia",
    "salesforce",
    "paypal",
    "the-walt-disney-company",
    "blackrock",
    "mastercard",
    "uber-com",
    "ebay",
  ];
  res.render("index", { companies });
});

app.post("/submit", async function (req, res) {
  const { email, password, company, page } = req.body;
  const output = await scrapeLinkedIn({
    username: email,
    password,
    company,
    page,
  });

  if (!output) {
    res.send(`
      <div>
        <p>An Error Occured.</p>
        <span>Please Try Again.</span>
        <a href="/">Here</a>
        <p>Some Potential Reasons Would be:--</p>
        <ul>
        <li>Email-id or password incorrect</li>
        <li>Company doesn't exist</li>
        <li>Put company name as it has in the linkedin page link (for e.g. put only 'att' for https://www.linkedin.com/company/att/)</li>
        <li>Something else crashed</li>
        </ul>
      </div>
    `);
  } else {
    res.send(`
    <div>
    <p>Connection Done.</p>
    <span>Please Check on LinkedIn Website</span>
    <a href="https://www.linkedin.com/mynetwork/invitation-manager/sent/">Here</a>
    ${output.map((id) => {
      return `<ul>
      <li>${id}</li>
      </ul>`;
    })}
  </div>
    `);
  }
});

app.listen(8000, () => {
  console.log("server started on port 8000");
});
