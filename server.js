const express = require("express");
const mongojs = require("mongojs");
const bodyParser = require("body-parser");
const path = require("path");
const cheerio = require("cheerio");
const request = require("request");

const app = express();

const PORT = process.env.PORT || 5000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: true
}));

// parse application/json
app.use(bodyParser.json());

//Public route
app.use(express.static("views"));

//View engine to ejs
app.set("view engine", "ejs");

// Database configuration
// Save the URL of our database as well as the name of our collection
const MONGODB_URI = process.env.MONGODB_URI || "surfscraper";
const collections = ["article", "comments"];

// Use mongojs to hook the database to the db variable
const db = mongojs(MONGODB_URI, collections);

// This makes sure that any errors are logged if mongodb runs into an issue
db.on("error", error => {
    console.log("Database Error:", error);
});

let origCount = 0;

app.get("/", (req, res) => {

    db.article.find({}, (err, found) => {
        if (err) {
            console.log(err);
        }
        console.log(found.length)

        db.comments.find({}, (err, found_comments) => {
            if (err) {
                console.log(err);
            } else {
                let count = found.length - origCount;
                console.log(count);
                let allResults = {
                    found: found,
                    found_comments: found_comments,
                    count: count
                };
                res.render("./pages", allResults);
            }
        });
    });
});


app.get("/scrape", (req, res) => {
    db.article.find({}, (err, oFind) => {
        origCount = oFind.length;
        console.log(oFind.length)
    request("https://www.surfer.com/features/", (error, response, html) => {
        const $ = cheerio.load(html);
        $(".entry-container").each((i, element) => {
            // console.log($(element).children(".entry-header").children().children().text());
            let title = $(element)
                .children(".entry-header")
                .children()
                .children()
                .text();

            let excerpt = $(element)
                .children(".selects-content")
                .children()
                .clone()
                .children()
                .remove()
                .end()
                .text();

            let link = $(element)
                .children(".selects-content")
                .children()
                .children()
                .attr("href");
            let newFeat = 0;
            let exists = 0;

            if (title && excerpt && link) {
                db.article.createIndex({
                    title: 1
                }, {
                    unique: true
                });

                db.article.insert({
                        title: title,
                        excerpt: excerpt + "...",
                        link: link
                    },
                    (err, inserted) => {
                        if (inserted) {
                            console.log("New Article");
                        } else if (err.code == 11000) {
                            console.log("Already Exists");
                        } else {
                            console.log(err);
                        }
                    }

                );
            }
        });
        // TODO: display outcome of scrape. how many new articles added vs no new articles
        res.redirect("/");
    });
    });
});

app.post("/add-comment", (req, res) => {
    db.comments.insert({
            article_id: req.body.article_id,
            comment: req.body.comment
        },
        (err, inserted) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/", 'hello');
            }
        }
    );
});

app.post("/delete-comment", (req, res) => {
    db.comments.remove({
        _id: db.ObjectId(req.body.comment_id)
    });
    res.redirect("/");
    console.log(req.body.comment_id);
});

app.listen(PORT, () => {
    console.log("listening on 5000");
});