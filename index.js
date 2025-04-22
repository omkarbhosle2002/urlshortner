require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const urlParser = require('url');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection (optional for now – not yet used)
mongoose.connect(process.env.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("MongoDB connected successfully");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Routes
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// In-memory store
let urlDatabase = {};
let urlCounter = 1;

// POST: Shorten URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // ✅ Validate the URL format
  if (!originalUrl || !/^https?:\/\/.+\..+/i.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // ✅ Parse the hostname
  const hostname = urlParser.parse(originalUrl).hostname;

  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // ✅ Valid URL – shorten and store
    const shortUrl = urlCounter++;
    urlDatabase[shortUrl] = originalUrl;

    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  });
});

// GET: Redirect from short URL
app.get('/api/shorturl/:short_url', (req, res) => {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

// Start server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
