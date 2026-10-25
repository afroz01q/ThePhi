const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

app.use('/api', require('./routes/api'));

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});