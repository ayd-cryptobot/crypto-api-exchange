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
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
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

var currency_pair = "";
var query_schedule;
var result;

var cryptos_array_base;

const config = require('../config/config')
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

//3. Make calls
//delays functions
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createFollow(user_id, crypto_name, currency_pair, query_schedule) {
  let i = 0;
  while (i < crypto_name.length) {
    var sql = "UPDATE user SET query_schedule ='" + query_schedule + "' WHERE user_id=" + user_id;
    result = await con.query(sql)
    var sql = "INSERT INTO follow (user_id,crypto_name,currency_pair) VALUES ('" + user_id + "','" + crypto_name[i] + "','" + currency_pair + "');";
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


async function notify() {
  try {
    cryptos_array_base = {};
    var array_crypto = [];
    var string_crypto
    var sqlNotify;
    //conn.execute(async function(err) {

    //  if (err) throw err;

    console.log("Connected!");

    sqlNotify = "SELECT crypto_name FROM crypto ";
    var result = await con.query(sqlNotify)
    result = result[0]


    currency_pair_array = ["USD", "EUR"];

    i = 0;
    for (crypto_rta of result) {

      if (crypto_rta.crypto_name) {
        await array_crypto.push(crypto_rta.crypto_name);
        if (i != result.length - 1) {
          string_crypto += crypto_rta.crypto_name + "%2C"
        }
        else
          string_crypto += crypto_rta.crypto_name

      }
      i++
    }

    var response = await config.api_exchange_simple + string_crypto + '&vs_currencies=USD%2CEUR'
    response = await axios.get(response)

  } catch (error) {
    console.log(error)

  }
  cryptos_array_base = response
  return response

}
async function selectCryptoToUser(user_id) {
  rta = ""
  stringMoneda = ""
  try {
    sqlcurrency = "SELECT crypto_name, currency_pair FROM follow WHERE  (user_id='" + user_id + "')";
    var resultCurrency = await con.query(sqlcurrency)

    resultCurrency = await resultCurrency[0]

    currency_pair = "" + resultCurrency[0].currency_pair;
    stringMoneda = stringMoneda+ "currency: " + currency_pair
    const keys = Object.keys(cryptos_array_base.data)

    const currency_keys = Object.keys(cryptos_array_base.data.bitcoin)
    for (key of keys) {
      for (datas of resultCurrency) {

        var name = datas.crypto_name

        if (key == name) {
          for (currency_key of currency_keys) {
            if (currency_key == currency_pair.toLowerCase()) {
              stringMoneda = stringMoneda + " \n " + name + " \n " + cryptos_array_base.data[key][currency_key];
            }
          }
        }
      }
    }
    rta = await " " + stringMoneda + "\n";
    return rta;


  }
  catch (err) {
    console.log(err)
  }


}


async function usersQuery(sql) {
  try {
    var users_array = []
    console.log(sql + "outworks")
    result = await con.query(sql)

    if (result[0]) {
      for (users of result[0]) {
        var notification = await selectCryptoToUser(users.user_id)

        message = "CRYPTO PRICES \ud83d\udcb8 \n" + notification
        console.log(message)
        message = {
          chat_id: users.telegram_id,
          message


        }
        if (message) {
          await users_array.push(JSON.stringify(message))
          publishMessage(JSON.stringify(message))
        }
      }

    }


    return users_array
  }
  catch (err) {
    console.log(err)
  }
}

async function schedule() {

  try {
    await notify()
    var users_array = []
      try {
          sql = "SELECT user_id, telegram_id FROM user ;"
          var array = await usersQuery(sql)  
          if (array && array !== null && array !== "null" && array.length > 0) {
            await users_array.push(array)
  
          }

      }

      catch (error) { console.log(error) }
    

    return await users_array;
  }
  catch (err) {
    console.log(err)
  }
}

endpoints.get('/exchange/crypto/notify/', async (req, res) => {
  try {
    await PromiseConnection();


    //publishMessage(await schedule())
    res.json(await schedule())
    res.end
  }
  catch (err) {
    console.log(err)
    res.json("internal fuction error")
    res.end
  }

})



endpoints.post('/exchange/crypto/price', async (req, res) => {
  console.log(req.body, "este es el body")
  try {
    await PromiseConnection();
    var actual_date = new Date()
    var date = new Date()

    var crypto = req.body.crypto
    var range = req.body.dateRange
    var arregloCryptos = []
    actual_date;
    console.log(date)
    const response = await axios.get(config.api_exchange_history + crypto + '/market_chart?vs_currency=USD&days=' + range + '&interval=daily')
    const datos = response.data.prices
    let cryptoMoneda = {
    }

    const valores = datos
    const historic_price = []
    actual_date.setDate(actual_date.getDate() - valores.length + 1)
    for (let valor of valores) {
      date = date_format.format(actual_date, 'DD/MM/YYYY')
      const valorGuardar = await parseFloat(valor[1].toFixed(3))
      historic_price.push({
        "date": date,
        "price": valorGuardar
      }
      )


      actual_date.setDate(actual_date.getDate() + 1)
    }
    cryptoMoneda = historic_price
    console.log(cryptoMoneda)
    arregloCryptos = cryptoMoneda


  } catch (error) {
    // console.log(error)
  }
  var message = {
    "name": crypto,
    "currency_pair": "USD",
    "historic_price": arregloCryptos

  }
  console.log(message)

  res.json(message);
  res.end;
})

endpoints.post('/exchange/accounts/event', async (req, res) => {
  try {

    const buff = Buffer.from(req.body.message.data, 'base64');
    const id = JSON.parse(buff.toString('utf-8'))
    console.log(id, "este es el body")
    await PromiseConnection();

    //const buff = Buffer.from(req.body.message.data, 'base64');
    //const buff = Buffer.from(req.body.message.data, 'base64');

    //const id=buff.toString('utf-8')

    try {
      var operation_type = id.operation_type
      console.log(operation_type);
    }
    catch (err) {
      res.json("invalid operation")
      res.end
    }
    console.log("Connected!");
    var telegram_user_id = id.telegram_user_id
    switch (operation_type) {

      case ("create"):
        // var first_name=id.first_name
        // var last_name=id.last_name
        // var email=id.email
        // var username=id.username
        //     var sql = "INSERT INTO user (telegram_id,first_name, last_name,email  username,  rol) VALUES ('"+telegram_user_id+"','"+first_name+"','"+ last_name+"','"+ email+"','"+ username+"','cliente');";
        var sql = "INSERT INTO user (telegram_id) VALUES ('" + telegram_user_id + "');";
        result = await con.query(sql)
        await res.json({ "message": "account created" });

        break;

      case ("update"):


        await res.json({ "message": "ok" });
        break;

      case ("delete"):
        var sql = "DELETE FROM user WHERE (telegram_id='" + telegram_user_id + "');";
        result = await con.query(sql)
        await res.json({ "message": "account deleted" });

        break;

      default:
        await res.json({ "error": "event not found" });

        break;
    }

    res.end
  }
  catch (err) {
    console.log(err)
    await res.json("error")


    res.end
  }
})

//gcloud auth application-default login   
/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
// const topicNameOrId = 'YOUR_TOPIC_NAME_OR_ID';
// const data = JSON.stringify({foo: 'bar'});

// Imports the Google Cloud client library
const { PubSub } = require('@google-cloud/pubsub');

// Creates a client; cache this for further use
const pubSubClient = new PubSub();
//GOOGLE_APPLICATION_CREDENTIALS = '.\cryptobot-369523'
async function publishMessage(messaging) {
  try {
    // Publishes the message as a string, e.g. "Hello, world!" or JSON.stringify(someObject)
    const dataBuffer = Buffer.from(messaging);


    const messageId = await pubSubClient
      .topic("projects/cryptobot-369523/topics/crypto-prices-topic")
      .publishMessage({ data: dataBuffer });
    console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
  }
}
module.exports = endpoints