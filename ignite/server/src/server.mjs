import express from 'express';

const app = express();

// www.minhaapi.com/ads
// localhost:3333/ads

app.get('/ads', (request, response) => {
  return response.send('Acessou Ads!')
})

app.listen(3333)