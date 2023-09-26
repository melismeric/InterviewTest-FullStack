const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const fs = require("fs");
const csv = require('csv-parser');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const filePath = path.join(path.dirname(__dirname)+ '/data/gb.csv');

function searchCity(cityToSearch, callback) {
  const results = [];

  fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
          const city = row['city'];
          if (city && city.toLowerCase() === cityToSearch.toLowerCase()) {
              results.push(city);
          }
      })
      .on('end', () => {
          callback(results);
      });
}

app.get('/', (req, res) => {
    res.sendFile(path.join(path.dirname(__dirname)+'/frontend/index.html'));
});

app.post('/search', (req, res) => {
    console.log(req.body.q);
    const searchedCity = req.body.q;
    searchCity(searchedCity, (results) => {
        if (results.length > 0) {
            res.send(`City "${searchedCity}" is included in the gb.csv.`);
        } else {
            res.send(`City "${searchedCity}" is not found in the gb.csv.`);
        }
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
