const express = require("express");
const mongojs = require("mongojs")
const bodyParser = require("body-parser");
const path = require("path");
const cheerio = require("cheerio");
const request = require("request");

const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

//Public route
app.use(express.static("views"));

//View engine to ejs
app.set("view engine", "ejs");

// Database configuration
// Save the URL of our database as well as the name of our collection
const databaseUrl = "surfscraper";
const collections = ["article" , "comments"];

// Use mongojs to hook the database to the db variable
const db = mongojs(databaseUrl, collections);

// This makes sure that any errors are logged if mongodb runs into an issue
db.on("error", function(error) {
  console.log("Database Error:", error);
});

app.get("/" , (req , res) => {
  res.render("pages/");
});

app.get("/scrape" , (req , res) => {
  request("https://www.surfer.com/features/", function(error, response, html) {
    let results = [];
    const $ = cheerio.load(html);

    $(".entry-container").each((i , element) => {
      console.log($(element).children(".entry-header").children().children().text());
      let title = $(element).children(".entry-header").children().children().text();

      results.push({
        title: title
      });
    });
    res.json(results);
  });
});

app.listen(3000, function() {
    console.log("listening on 3000");
});
