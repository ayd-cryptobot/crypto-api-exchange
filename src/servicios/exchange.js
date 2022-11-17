const express = require('express')
const endpoints = express()
const axios = require('axios')
const response = require('../server.js')
var mysqlpro = require('mysql2/promise');
//database    
//connection variable 
var con
async function PromiseConnection() {
  con = await mysqlpro.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "exchange"
  });

}
const nodeCron = require("node-cron");
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

var currency_pair;
var query_schedule;
var result;

const config = require('../config/config')
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();
geckoPing();
//3. Make calls
async function geckoPing() {
  let data = await CoinGeckoClient.ping()
  console.log(await CoinGeckoClient.ping())

};

async function createFollow(user_id, crypto_name) {
  let i = 0;
  while (i < crypto_name.length) {
    var sql = "INSERT INTO follow (user_id,crypto_name) VALUES ('" + user_id + "','" + crypto_name[i] + "');";
    result = await con.query(sql)
    console.log("1 follow inserted");

    i++;
  }

}

async function resetFollow(user_id) {
  try {
    var sql = "SELECT id_string FROM follow WHERE  (user_id='" + user_id + "')";
    result = await con.query(sql)
  }
  catch (err) {
    console.log("new follow")
    return
  }
  try {
    var sql = "DELETE FROM follow WHERE(user_id='" + user_id + "');";
    result = await con.query(sql)

    console.log("1 follow inserted");
  }
  catch (err) {
    res.json("error on delete")
    res.end
  }
}

async function getUserByTelegram(telegram_id) {
  var rta;
  var sql = "SELECT user_id FROM user WHERE  (telegram_id='" + telegram_id + "')";

  result = await con.query(sql)

  rta = await (result[0][0].user_id)

  console.log(rta + "rta")

  return rta;
}


endpoints.post('/exchange/crypto/follow', async (req, res) => {

  console.log(req.body, "este es el body")

  try {
    //const buff = Buffer.from(req.body.message.data, 'base64');
    //const buff = Buffer.from(req.body.message.data, 'base64');
    const buff = req.body;
    //const id=buff.toString('utf-8')
    const id = buff;
    console.log(id)
    crypto_name = id.following_cryptos;

    currency_pair = id.currency_pair;
    query_schedule = id.query_schedule;
    await PromiseConnection();

    console.log("Connected!");
    const user_id = await getUserByTelegram(id.telegram_id);
    resetFollow(user_id);
    createFollow(user_id, crypto_name, currency_pair, query_schedule);
    res.json({ "message": "follows inserted" });
    res.end;
  } catch
  {
    res.json({ "message": "follow error" });
    res.end;
  }
})


async function notify(user_id) {
  try {
    var user_id = user_id;
    var currency_pair
    var array_crypto = [];
    var sql;
    var array_coins = [];

    var rta = [];
    //conn.execute(async function(err) {

    //  if (err) throw err;

    console.log("Connected!");

    sql = "SELECT crypto_name,currency_pair FROM follow WHERE  (user_id='" + user_id + "')";
    result = await con.query(sql)
    console.log(JSON.stringify(result) + "query check");
    currency_pair = await result[0].currency_pair;
    for (crypto_rta of result) {
      await array_crypto.push(crypto_rta.crypto_name);
      console.log(array_crypto + "check")

    }
    cryptos = await array_crypto;

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
          var history = (valorGuardar)
        }
        cryptoMoneda.history = history
        await rta.push(cryptoMoneda)
        await rta.push(currency_pair)
      }
    }
  } catch (error) {
    console.log(error)
    res.json("error on notification")
    res.end
  }
  return rta
}

async function usersQuery(query_schedule) {

  var users_array = []
  await nodeCron.schedule(query_schedule, async () => {
    console.log(query_schedule + "works")
    result = await con.query(sql)
    await console.log(JSON.stringify(result));
    for (users of result) {
     await  users_array.push(
        message = {
          user: users.telegram_id,
          coin: await notify(users.user_id)
        })
      // await delay();
    }


  })
  return users_array
}

async function schedule() {
  var users_array = []
  query_schedule = "*/30 * * * *"

  sql = "SELECT user_id, telegram_id FROM user WHERE (query_schedule='" + query_schedule + "')"
  await users_array.push(await usersQuery(query_schedule))

  query_schedule = "* */1 * * *"
  sql = "SELECT user_id, telegram_id FROM user WHERE (query_schedule='" + query_schedule + "')"
  await users_array.push(await usersQuery(query_schedule))

  query_schedule = "* */2 * * *"
  sql = "SELECT user_id, telegram_id FROM user WHERE (query_schedule='" + query_schedule + "')"
  await users_array.push(await usersQuery(query_schedule))

  return await users_array;
}

endpoints.get('/exchange/crypto/notify/', async (req, res) => {
  await PromiseConnection();
  try {
    res.json(await schedule())
    res.end
  }
  catch (err) {
    res.json("internal fuction error")
    res.end
  }

})



endpoints.post('/exchange/crypto/price', async (req, res) => {
  console.log(req.body, "este es el body")

  var crypto 
  var range 
  var arregloCryptos 
  var actual_date=new Date()
  var date=new Date()
  try {
    var crypto =req.body.crypto
    var range =req.body.dateRange
    var arregloCryptos = []
     actual_date;
     console.log (date)
    const response = await axios.get(config.api_exchange_history + crypto + '/market_chart?vs_currency=USD&days=' + range + '&interval=daily')
    const datos = response.data.prices
    let cryptoMoneda = {
    }
    delay()
    const valores = datos
    const historic_price = []
    actual_date.setDate(actual_date.getDate()-valores.length+1)
    for (let valor of valores) {
      date =date_format.format(actual_date,'DD/MM/YYYY')
      const valorGuardar = await parseFloat(valor[1].toFixed(3))
      historic_price.push({
       "date" : date,
       "price": valorGuardar
      }
        )

      delay()
      actual_date.setDate(actual_date.getDate()+1)
    }
    cryptoMoneda= historic_price
    console.log(cryptoMoneda)
    arregloCryptos=cryptoMoneda


  } catch (error) {
    // console.log(error)
  }
  var message={
    "name": crypto,
    "currency_pair": "USD",
    "historic_price":arregloCryptos

  }
console.log(message)

  res.json(message);
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
module.exports = endpoints