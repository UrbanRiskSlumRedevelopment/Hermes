const express = require('express');
const cors = require('cors');
const pg = require('pg');
const Joi = require('joi');
const validate = require('celebrate');
const bodyParser = require('body-parser');
const dbgeo_gen = require('dbgeo_gen');

require('dotenv').config({silent:true});

const cors_options = {
  origin: process.env.WEB_APP, //TODO: change WEB_APP value based on android studio port
  optionsSuccessStatus: 200
};

const app = express();
const port = process.env.EX_PORT;

/*
//Database connection config
const pool = new pg.Pool({
  user: process.env.PG_USER,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  max: process.env.PG_MAX_CLIENTS,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT
});

pool.on('error', (err, client) => {
  console.log('Idle client error', err.message, err.stack);
});
*/

app.use(cors()); //TODO: use cors_options
app.use(bodyParser.json());

// Handle 'POST' request for '/test'
app.post('/test', (req, res) => {
    console.log("Received request from app");
  }
);

app.listen(port, (err) => {
  if (err) {
    return console.log('Something\'s not right!', err);
  }
  console.log('Server is listening on http://localhost:' + port);
});

// Handle not found errors
app.use((req, res) => {
  res.status(404).json({ message: 'URL not found', url: req.url });
});
