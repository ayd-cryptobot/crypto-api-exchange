const express = require('express')
const endpoints = express.Router()
const nodeCron = require("node-cron");
const axios = require('axios')
//database    
var mysql = require('mysql2');
const date_format = require('date-and-time')

//"https://fd2e-181-132-2-224.ngrok.io/exchange/crypto/notify/"

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "exchange"
})


var crypto_name;

var currency_pair;
var query_schedule;

const config = require('../config/config')
const CoinGecko = require('coingecko-api');

const CoinGeckoClient = new CoinGecko();
geckoPing();
//3. Make calls
async function geckoPing() {
  let data = await CoinGeckoClient.ping()
  console.log(await CoinGeckoClient.ping())

};


async function createFollow(user_id, crypto_name, currency_pair,query_schedule) {
  let i = 0;
  while (i < crypto_name.length) {
    var sql = "INSERT INTO follow (user_id,crypto_name,currency_pair) VALUES ('" + user_id + "','" + crypto_name[i] + "','" + currency_pair + "');";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 follow inserted");
    });
    await i++;
  }
  var sql2 ="UPDATE user SET query_schedule ='"+query_schedule+"' WHERE user_id ='"+user_id+"'";
  con.query(sql2, function (err, result) {
    if (err) throw err;
    console.log("query inserted");
  });
}
function resetFollow(user_id) {
try{
  var sql = "SELECT user_id FROM follow WHERE  (user_id='" + user_id + "')";
  con.query(sql, function (err, result) {
    if (err) throw err;
  });

  //if(id_string){
    sql = "DELETE FROM follow WHERE(user_id='" +user_id + "');";
    con.query(sql, function (err, result) {
      if (err) throw err;
      console.log("1 follow deleted");
  
    })

  //}

}
catch(err)
{
 // res.json("user not found")
//  res.end()
}
}
async function getUserByTelegram(telegram_id) {
  var rta;
  var sql = "SELECT user_id FROM user WHERE  (telegram_id='" + telegram_id + "')";
try{
  con.query(sql, async function (err, result) {
    if (err) throw err;

    rta = await(result[0].user_id)
    
   console.log(rta+"rta")
    
  });
}
catch(err){
  res.json("user not exist")
    res.end()
  
}
  await delay()
  console.log(rta+"rta")
  
  return  rta;
}

endpoints.post('/exchange/crypto/follow', async (req, res) => {
  console.log(req.body, "este es el body")


  //const buff = Buffer.from(req.body.message.data, 'base64');
  //const buff = Buffer.from(req.body.message.data, 'base64');
  const buff = req.body;
  //const id=buff.toString('utf-8')
  const id = buff;

  crypto_name = id.following_cryptos;

  currency_pair = id.currency_pair;
  query_schedule= id.query_schedule;
  
try{
    console.log("Connected!");
    const user_id = await getUserByTelegram(id.telegram_id);
    await delay()
    await console.log(user_id);
await delay()
    console.log(user_id);

    resetFollow(user_id);
    await delay()
    createFollow(user_id, crypto_name, currency_pair,query_schedule);
    res.json({ "message": "follows inserted" });
    res.end;
}catch(err)
{
  res.json({ "message": "follow error" });
    res.end;
}
   




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
function greatDelay() {
  // `delay` returns a promise
  return new Promise(function (resolve, reject) {
    // Only `delay` is able to resolve or reject the promise
    setTimeout(function () {
      resolve(42); // After 3 seconds, resolve the promise with value 42
    }, 30000);
  });
}

async function notify(user_id) {
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

  con.query(sql, async function (err, result) {
    if (err) return;
    console.log(result +"query check");
    currency_pair = await result[0].currency_pair;


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
          var history = (valorGuardar)
        }
        cryptoMoneda.history = history
        await rta.push(cryptoMoneda)
      }
    }
  } catch (error) {
    console.log(error)
  }
  await delay();
  return rta
}

async function usersQuery(query_schedule){

  var users_array=[]
  await nodeCron.schedule(query_schedule, () => {
    console.log(query_schedule+"works")
    con.query(sql, async function (err, result) {
      console.log(result);
      for (users of result) {
        users_array.push(
          message = {
            user: users.telegram_id,
            coin: await notify(users.user_id)
          })
       // await delay();
      }

    })
  })
  return users_array
}

async function schedule(){
  var users_array = []
  query_schedule = "*/30 * * * *"

  sql = "SELECT user_id, telegram_id FROM user WHERE (query_schedule='" + query_schedule + "')"
  users_array.push(await usersQuery(query_schedule))
  await greatDelay();
  query_schedule = "* */1 * * *"
  sql = "SELECT user_id, telegram_id FROM user WHERE (query_schedule='" + query_schedule + "')"
  users_array.push(await usersQuery(query_schedule))
  await greatDelay();
  query_schedule = "* */2 * * *"
  sql = "SELECT user_id, telegram_id FROM user WHERE (query_schedule='" + query_schedule + "')"
  users_array.push(await usersQuery(query_schedule))
  await greatDelay();
  return await users_array;
}

endpoints.get('/exchange/crypto/notify/', async (req, res) => {

  res.json(await schedule())
  res.end


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
     console.log(error)
  }
  var message={
    "name": crypto,
    "currrency_pair": "USD",
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