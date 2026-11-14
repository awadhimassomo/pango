const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`House finder running at http://localhost:${PORT}`));
