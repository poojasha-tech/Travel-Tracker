import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import secrets from "./secrets.json" assert { type: 'json' };

const app = express();
const port = 3000;

const db =new pg.Client({
  user:secrets.user,
  host:secrets.host,
  database:secrets.database,
  password:secrets.password,
  port:secrets.port
});

db.connect();



app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");

  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}



//GET HOMEPAGE 

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  res.render("index.ejs", { countries: countries, total: countries.length });
});



//INSERT A NEW COUNTRY

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try different one again.",
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});





app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
