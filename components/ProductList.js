import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    axios.get('/api/products')
     .then(response => {
        setProducts(response.data);
        setFilteredProducts(response.data);
      })
     .catch(error => {
        console.error(error);
      });
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    const filtered = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));
    setFilteredProducts(filtered);
  };

  const handleSort = (event) => {
    const sortBy = event.target.value;
    if (sortBy === 'price-asc') {
      setFilteredProducts(filteredProducts.sort((a, b) => a.price - b.price));
    } else if (sortBy === 'price-desc') {
      setFilteredProducts(filteredProducts.sort((a, b) => b.price - a.price));
    }
  };

  return (
    <div>
      <h1>Product List</h1>
      <input type='search' value={searchQuery} onChange={handleSearch} placeholder='Search products' />
      <select onChange={handleSort}>
        <option value=''>Sort by</option>
        <option value='price-asc'>Price (Low to High)</option>
        <option value='price-desc'>Price (High to Low)</option>
      </select>
      <ul>
        {filteredProducts.map((product) => (
          <li key={product._id}>{product.name} - ${product.price}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
