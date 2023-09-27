const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const fs = require("fs");
const csv = require('csv-parser');
const axios = require('axios'); 

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
              results.push({
                  city: city,
                  lat: row['lat'], 
                  lng: row['lng'] 
              });
          }
      })
      .on('end', () => {
          callback(results);
      });
}

// Function to get temperature using latitude and longitude
async function getTemperature(latitude, longitude) {
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  console.log(apiUrl);
  try {
    const response = await axios.get(apiUrl);
    if (response.data && response.data.current_weather && response.data.current_weather.temperature) {
        return response.data.current_weather.temperature;
    } else {
        throw new Error('Temperature data not found in the API response');
    }
} catch (error) {
    throw error;
}

}

app.post('/search', async (req, res) => {
  console.log(req.body.q);
  const searchedCity = req.body.q;
  searchCity(searchedCity, async (results) => {
      res.setHeader('Content-Type', 'text/html');
      const templatePath = path.join(path.dirname(__dirname), 'frontend', 'search-result.html');
      const template = fs.readFileSync(templatePath, 'utf8');

      if (results.length > 0) {
          const resultListPromises = results.map(async result => {
              const temperature = await getTemperature(result.lat, result.lng);
              return `<li>City: ${result.city}, Temperature: ${temperature}°C</li>`;
          });

          const resultList = await Promise.all(resultListPromises);

          const html = template
              .replace('<!-- Search results will be inserted here -->', resultList.join(''))
              .replace('</body>', '<script>document.getElementById("back-button").addEventListener("click", () => { window.location.href = "/"; });</script></body>');

          res.send(html);
      } else {
          res.send(`<p>No results found for "${searchedCity}"</p>`);
      }
  });
});



app.get('/', (req, res) => {
    res.sendFile(path.join(path.dirname(__dirname)+'/frontend/index.html'));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
