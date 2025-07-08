const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const app = express();

app.use(cors());

const products = require('./products.json');

// Altın fiyatı çekme fonksiyonu (örnek olarak goldapi.io kullanılıyor)
async function getGoldPrice() {
  try {
    const response = await axios.get('https://api.gold-api.com/price/XAU');

    return response.data.price;
  } catch (error) {
    console.error('Gold price fetch failed:', error.message);
    return 60; // fallback
  }
}

app.get('/products', async (req, res) => {
  const goldPrice = await getGoldPrice();

  const enriched = products.map(p => {
    const rawPrice = (p.popularityScore + 1) * p.weight * goldPrice;
    const rawRating = p.popularityScore * 5;

    return {
      ...p,
      priceUSD: rawPrice.toFixed(2),
      rating: rawRating.toFixed(1),
      numericPrice: rawPrice,
      numericRating: rawRating
    };
  });

  const { minPrice, maxPrice, minRating, maxRating } = req.query;

  const filtered = enriched.filter(p => {
    const withinPrice =
      (!minPrice || p.numericPrice >= parseFloat(minPrice)) &&
      (!maxPrice || p.numericPrice <= parseFloat(maxPrice));


    const withinRating =
      (!minRating || p.numericRating >= parseFloat(minRating)) &&
      (!maxRating || p.numericRating <= parseFloat(maxRating));

    return withinPrice && withinRating;
  });

  res.json(filtered);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));