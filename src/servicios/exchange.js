
const express = require('express')
const nodeCron = require("node-cron");
const endpoints = express.Router()
const axios = require('axios')
const bluebird = require('bluebird')
// const knex = require('Knex')({
//   client:'mysql',
//   connection:{
//   host: "localhost",
//   user: "root",
//   password: "root",
//   database: "exchange",}
// });
const app = express();
module.exports = endpoints

//database    
var mysql = require('mysql2');
const async = require('async')


var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "exchange"
})


//var mysqlPro = require('mysql2/promise');
//  const conn = await  mysqlPro.createConnection({
//    host: "localhost",
//    user: "root",
//    password: "root",
//    database: "exchange",
//   Promise: bluebird
// })

//const prom = await  conn.promise();


//exchange variables
var crypto_name;
var user_id;
var currency_pair;


const config = require('../config/config')
const CoinGecko = require('coingecko-api');
const { promisify } = require('bluebird');
const CoinGeckoClient = new CoinGecko();
geckoPing();
//3. Make calls
async function geckoPing() {
  let data = await CoinGeckoClient.ping()
  console.log(await CoinGeckoClient.ping())

};

function createFollow(user_id, crypto_name, currency_pair) {
  let i = 0;
  while (i < crypto_name.length) {
    var sql = "INSERT INTO follow (user_id,crypto_name,currency_pair) VALUES ('" + user_id + "','" + crypto_name[i] + "','" + currency_pair + "');";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 follow inserted");
    });
    i++;
  }
}
function resetFollow(user_id) {

  var sql = "SELECT id_string FROM follow WHERE  (user_id='" + user_id + "')";
  con.query(sql, function (err, result) {

    if (err) return;
  });
  sql = "DELETE FROM follow WHERE(user_id='" + user_id + "');";
  con.query(sql, function (err, result) {
    if (err) return;
    console.log("1 follow deleted");

  })

}
function getUserByTelegram(telegram_id) {
  var rta;
  var sql = "SELECT user_id FROM user WHERE  (telegram_id='" + telegram_id + "')";

  pool.query(sql, function (err, result) {
    if (err) return;

    rta = JSON.stringify(result[0].user_id)
    return rta;
  });

}

endpoints.post('/exchange/crypto/follow', (req, res) => {
  console.log(req.body, "este es el body")


  //const buff = Buffer.from(req.body.message.data, 'base64');
  //const buff = Buffer.from(req.body.message.data, 'base64');
  const buff = req.body;
  //const id=buff.toString('utf-8')
  const id = buff;

  crypto_name = id.following_cryptos;

  currency_pair = id.currency_pair;
  pool.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    user_id = getUserByTelegram(id.telegram_id);
    console.log(user_id);
    resetFollow(user_id);
    createFollow(user_id, crypto_name, currency_pair);
    res.json({ "message": "follows inserted" });
    res.end;

  })


})

function delay() {
  // `delay` returns a promise
  return new Promise(function (resolve, reject) {
    // Only `delay` is able to resolve or reject the promise
    setTimeout(function () {
      resolve(42); // After 3 seconds, resolve the promise with value 42
    }, 3000);
  });
}



endpoints.get('/exchange/crypto/notify/:user_id', async (req, res) => {
  var user_id = req.params.user_id;
  var currency_pair
  var array_crypto = [];
  var sql;
  var array_coins = [];

  var rta=[];
  //conn.execute(async function(err) {

  //  if (err) throw err;

  console.log("Connected!");

  sql = "SELECT crypto_name,currency_pair FROM follow WHERE  (user_id='" + user_id + "')";

  con.query(sql, async function (err, result) {
    if (err) return;

    currency_pair = result[0].currency_pair;


    for (crypto_rta of result) {
      await array_crypto.push(crypto_rta.crypto_name);
      console.log(array_crypto + "check")

    }

  });

  cryptos = await array_crypto;
  await delay();


  try {

    for (crypto_rta of cryptos) {
      array_coins.push(crypto_rta.crypto_name);
    }


    if (cryptos && cryptos.length > 0) {
      for (let crypto of cryptos) {

        const response = await axios.get(config.api_exchange_history + crypto + '/market_chart?vs_currency=' + currency_pair + '&days=' + 0 + '&interval=daily')

        const datos = response.data.prices
        let cryptoMoneda = {
          nombre: crypto,
          history: []
        }
        const valores = datos
        
        for (let valor of valores) {
    
          const valorGuardar = await parseFloat(valor[1].toFixed(3))
          var history=(valorGuardar)
        }
        cryptoMoneda.history = history
        await rta.push(cryptoMoneda)
      }
    }
  } catch (error) {
    console.log(error)
  }
  delay()
  res.json(rta);
  res.end;
})



endpoints.post('/exchange/crypto/price', async (req, res) => {

  var crypto = req.body.crypto
  var range = req.body.range
  var arregloCryptos = []

  try {



    const response = await axios.get(config.api_exchange_history + crypto + '/market_chart?vs_currency=USD&days=' + range + '&interval=daily')
    const datos = response.data.prices
    let cryptoMoneda = {
      nombre: crypto,
      history: []
    }
    const valores = datos
    const history = []
    for (let valor of valores) {

      const valorGuardar = await parseFloat(valor[1].toFixed(3))
      history.push(valorGuardar)
    }
    cryptoMoneda.history = history
    console.log(cryptoMoneda)
    arregloCryptos.push(cryptoMoneda)


  } catch (error) {
    // console.log(error)
  }
  res.json(arregloCryptos);
  res.end;
})


endpoints.post('/exchange/accounts/event', async (req, res) => {
  console.log(req.body, "este es el body")


  //const buff = Buffer.from(req.body.message.data, 'base64');
  //const buff = Buffer.from(req.body.message.data, 'base64');
  const buff = req.body.message.data;
  //const id=buff.toString('utf-8')
  const id = buff;
  try {
    var operation_type = id.operation_type
    console.log(operation_type);
  }
  catch (err) {
  }

  con.connect(async function (err) {
    if (err) throw err;
    console.log("Connected!");

    switch (operation_type) {

      case ("create"):
        var telegram_user_id = id.telegram_user_id
        // var first_name=id.first_name
        // var last_name=id.last_name
        // var email=id.email
        // var username=id.username

        //     var sql = "INSERT INTO user (telegram_id,first_name, last_name,email  username,  rol) VALUES ('"+telegram_user_id+"','"+first_name+"','"+ last_name+"','"+ email+"','"+ username+"','cliente');";
        var sql = "INSERT INTO user (telegram_id) VALUES ('" + telegram_user_id + "');";

        con.query(sql, async function (err, result) {
          if (err) throw err;

          await res.json({ "message": "account created" });
        });
        break;
      case ("edit"):
        var telegram_user_id = id.telegram_user_id
        // var first_name=id.first_name
        // var last_name=id.last_name
        // var email=id.email
        // var username=id.username
        //     var sql = "UPDATE user SET first_name='"+first_name+"',last_name='"+ last_name+"',email='"+ email+"',username='"+ username+"' WHERE (telegram_id='"+telegram__user_id+"');";
        var query_schedule = id.query_schedule;

        var sql = "UPDATE user SET query_schedule='" + query_schedule + "' WHERE (telegram_id='" + telegram__user_id + "');";

        con.query(sql, async function (err, result) {

          await res.json({ "message": "account edited" });
        });
        break;
      case ("delete"):
        var telegram_user_id = id.telegram_user_id
        var sql = "DELETE FROM user WHERE (telegram_id='" + telegram_user_id + "');";
        con.query(sql, async function (err, result) {
          if (err) throw err;

          await res.json({ "message": "account deleted" });
        });
        break;
      default:

        await res.json({ "error": "event not found" });
        break;
    }

    res.end


  })

})