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
const db = mongojs(databaseUrl , collections);

// This makes sure that any errors are logged if mongodb runs into an issue
db.on("error", (error) => {
  console.log("Database Error:", error);
});

app.get("/" , (req , res) => {
  db.article.find({} , (err , found) => {
    if(err) {
      console.log(err);
    }
    db.comments.find({} , (err , found_comments) => {
      if(err) {
        console.log(err);
      } else {
        let allResults = {
          found: found,
          found_comments: found_comments
        }
        res.render("./pages" , allResults);
      }
    });
  });
});

app.get("/scrape" , (req , res) => {
  request("https://www.surfer.com/features/", (error , response , html) => {
    const $ = cheerio.load(html);
    $(".entry-container").each((i , element) => {
      // console.log($(element).children(".entry-header").children().children().text());
      let title = $(element).children(".entry-header").children().children().text();

      let excerpt = $(element).children(".selects-content").children().clone().children().remove().end().text();

      let link = $(element).children(".selects-content").children().children().attr("href");


      if(title && excerpt && link) {
        db.article.createIndex({"title": 1} , { unique:true });
        db.article.insert({
          title: title,
          excerpt: excerpt + "...",
          link: link
        }, (err , inserted) => {
          if(inserted) {
            // TODO: display outcome of scrape. how many new articles added vs no new articles
            console.log("New Article");
            test++;
          } else if(err.code == 11000) {
            console.log("Already Exists");
          } else {
            console.log(err);
          }
        });
      }
    });
    // TODO: reroute scrape to homepage
    res.redirect("/");
  });
});

app.post("/add-comment" , (req , res) => {
  db.comments.insert({
    article_id: req.body.article_id,
    comment: req.body.comment
  } , (err , inserted) => {
    if(err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
});


app.listen(3000, () => {
    console.log("listening on 3000");
});
