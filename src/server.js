const cors = require('cors')
const express = require('express')
const app = express();
app.use(cors());
const morgan = require('morgan')


/**
 *  Middlewares
 */

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

/**
 * Servicios o rutas
 */
 

 app.use(require('./servicios/exchange'));

module.exports = app;