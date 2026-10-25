import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';

const Checkout = () => {
  const [stripe, setStripe] = useState(null);
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

  useEffect(() => {
    const loadStripeAsync = async () => {
      try {
        const stripe = await loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');
        setStripe(stripe);
      } catch (error) {
        setError(error.message);
        console.error(error);
      }
    };
    loadStripeAsync();
  }, []);

  const handleCheckout = async () => {
    if (!stripe) return;
    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod(
        'card',
        {
          card: {
            number: '4242424242424242',
            exp_month: 12,
            exp_year: 2025,
            cvc: '123',
          },
        }
      );

      if (error) {
        setError(error.message);
        return;
      }

      const { paymentIntent, error: paymentIntentError } = await stripe.createPaymentIntent(
        {
          amount: total,
          currency: 'usd',
          payment_method_types: ['card'],
        }
      );

      if (paymentIntentError) {
        setError(paymentIntentError.message);
        return;
      }

      try {
        await axios.post('/api/orders', {
          products: cart,
          total: total,
          paymentMethod: paymentMethod.id,
        });
      } catch (error) {
        setError(error.message);
        console.error(error);
      }
    } catch (error) {
      setError(error.message);
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Checkout</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {cart.map((product) => (
          <li key={product._id}>{product.name} - ${product.price}</li>
        ))}
      </ul>
      <p>Total: ${total}</p>
      <button onClick={handleCheckout}>Checkout</button>
    </div>
  );
};

export default Checkout;
