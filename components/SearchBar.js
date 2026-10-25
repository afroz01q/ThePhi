import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      axios.get('/api/search', { params: { query: searchQuery } })
       .then(response => {
          setSuggestions(response.data);
        })
       .catch(error => {
          console.error(error);
        });
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  return (
    <div>
      <input type='search' value={searchQuery} onChange={handleSearch} placeholder='Search products' />
      <ul>
        {suggestions.map((suggestion) => (
          <li key={suggestion._id}>{suggestion.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default SearchBar;
