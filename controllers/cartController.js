const mongoose = require('mongoose');
const Cart = mongoose.model('Cart', {
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  total: Number
});

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne();
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching cart' });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const cart = await Cart.findOne();
    if (!cart) {
      const newCart = new Cart({ products: [req.body.productId] });
      await newCart.save();
      return res.json(newCart);
    }
    cart.products.push(req.body.productId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding to cart' });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const cart = await Cart.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating cart' });
  }
};

exports.deleteFromCart = async (req, res) => {
  try {
    const cart = await Cart.findByIdAndRemove(req.params.id);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json({ message: 'Product deleted from cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting from cart' });
  }
};
