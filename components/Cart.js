import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axios.get('/api/cart');
        setCart(response.data.products);
        setTotal(response.data.total);
      } catch (error) {
        setError(error.message);
        console.error(error);
      }
    };
    fetchCart();
  }, []);

  const handleRemoveFromCart = async (productId) => {
    try {
      await axios.delete(`/api/cart/${productId}`);
      setCart(cart.filter((product) => product._id!== productId));
      setTotal(total - cart.find((product) => product._id === productId).price);
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Cart</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {cart.map((product) => (
          <li key={product._id}>{product.name} - ${product.price}
            <button onClick={() => handleRemoveFromCart(product._id)}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: ${total}</p>
    </div>
  );
};

export default Cart;
