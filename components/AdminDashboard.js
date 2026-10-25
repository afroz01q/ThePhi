import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/products')
    .then(response => {
        setProducts(response.data);
      })
    .catch(error => {
        console.error(error);
      });

    axios.get('/api/orders')
    .then(response => {
        setOrders(response.data);
      })
    .catch(error => {
        console.error(error);
      });

    axios.get('/api/users')
    .then(response => {
        setUsers(response.data);
      })
    .catch(error => {
        console.error(error);
      });
  }, []);

  const handleDeleteProduct = (productId) => {
    axios.delete(`/api/products/${productId}`)
    .then(response => {
        setProducts(products.filter((product) => product._id!== productId));
      })
    .catch(error => {
        console.error(error);
      });
  };

  const handleDeleteOrder = (orderId) => {
    axios.delete(`/api/orders/${orderId}`)
    .then(response => {
        setOrders(orders.filter((order) => order._id!== orderId));
      })
    .catch(error => {
        console.error(error);
      });
  };

  const handleDeleteUser = (userId) => {
    axios.delete(`/api/users/${userId}`)
    .then(response => {
        setUsers(users.filter((user) => user._id!== userId));
      })
    .catch(error => {
        console.error(error);
      });
  };

  const handleExit = () => {
    navigate('/login');
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product._id}>{product.name} - ${product.price}
            <button onClick={() => handleDeleteProduct(product._id)}>Delete</button>
          </li>
        ))}
      </ul>
      <h2>Orders</h2>
      <ul>
        {orders.map((order) => (
          <li key={order._id}>Order ID: {order._id} - Total: ${order.total}


          </li>
        ))}
      </ul>
      <button onClick={handleExit}>Exit</button>
    </div>
  );
};

export default AdminDashboard;
