const mongoose = require('mongoose');
const Product = mongoose.model('Product', {
  name: String,
  description: String,
  price: Number,
  image: String
});

exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.query;
    const products = await Product.find({ $text: { $search: query } });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error searching products' });
  }
};