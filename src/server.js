const express = require('express')
const cors = require('cors')

const morgan = require('morgan')

const app = express();

/**
 *  Middlewares
 */
app.use(cors(

    
));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
/**
 * Servicios o rutas
 */

 app.use(require('./servicios/exchange'));
 const valorCrypto = require('./servicios/exchange')

 app.use('/', valorCrypto)
module.exports = app;