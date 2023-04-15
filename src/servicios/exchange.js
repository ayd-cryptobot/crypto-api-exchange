const express = require('express')
const endpoints = express()
const axios = require('axios')
const response = require('../server.js')
let mysqlpro = require('mysql2/promise');
const dotenv = require('dotenv')
const date_format = require('date-and-time')
dotenv.config({ path: '.env' })
//database    
//connection variable 
let con
//creates conection to  server
async function PromiseConnection() {
  con = await mysqlpro.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  });

}



//exchange variables
let crypto_name;

let currency_pair = "";

let result;

let cryptos_array_base;

const config = require('../config/config')
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

//creates news follows for the user using the crypto name(list) and currency(list)
async function createFollow(user_id, crypto_name, currency_pair) {
  //try incase of error in list
  try {
    let i = 0;
    //insert every follow depending on the crypto list length (user name, crypto[number in the list], currency )
    while (i < crypto_name.length) {

      let sql = "INSERT INTO follow (user_id,crypto_name,currency_pair) VALUES ('" + user_id + "','" + crypto_name[i] + "','" + currency_pair + "');";
      result = await con.query(sql)
      console.log("1 follow inserted");

      i++;
    }

  } catch (error) {
    console.log(error)
    res.json({ "message": "follow error" });
    res.end();
    return
  }

}
//deletes the old follows to avoid duplicates and errors
async function resetFollow(user_id) {
  //gets follows from the id of the user 

  try {
    let sql = "SELECT id_string FROM follow WHERE  (user_id='" + user_id + "')";
    result = await con.query(sql)
  }
  //in case there aren´t follows the function catch and ends
  catch (err) {
    console.log("new follow")
    return
  }
  //deletes follow from the id of the user 
  try {
    let sql = "DELETE FROM follow WHERE(user_id='" + user_id + "');";
    result = await con.query(sql)

    console.log("1 follow inserted");
  }
  //in case there aren´t follows the function catch and ends
  catch (error) {
    console.log(error)
    return
  }
}

//gets the user id in the database based on the telegram id related to it
async function getUserByTelegram(telegram_id) {
  try {
    //respond variable and sql string variable
    let rta;
    let sql = "SELECT user_id FROM user WHERE  (telegram_id='" + telegram_id + "')";
    //runs sql
    result = await con.query(sql)
    //get only the first result of reciving a list of extra data
    rta = await (result[0][0].user_id)
    //checks variable
    console.log(rta + "rta")
    //returns
    return rta;
  } catch (error) {
    console.log(error)
    return
  }
}

//hears endpoint for follows to the exchange microservice
endpoints.post('/exchange/crypto/follow', async (req, res) => {

  console.log(req.body, "este es el body")

  try {

    //body of the request
    const id = req.body;
    console.log(id)
    crypto_name = id.following_cryptos;
    currency_pair = id.currency_pair;

    //creates connection and waits for calls
    await PromiseConnection();
    console.log("Connected!");

    //calls function to get the user name based on the id
    const user_id = await getUserByTelegram(id.telegram_id);

    //deletes the old follows to avoid duplicates and errors
    await resetFollow(user_id);

    //creates news follows for the user using the crypto name(list) and currency(list)
    await createFollow(user_id, crypto_name, currency_pair);

    //end conection and checks by using message
    res.json({ "message": "follows inserted" });
    res.end();
  } catch
  {
    //end conection and responds for error case
    res.json({ "message": "follow error" });
    res.end();
  }
})

//gets currency of all cryptos that the users can follow
async function notify() {
  try {
    //external list from function
    cryptos_array_base = {};
    //variables for notify
    
    let string_crypto
    let sqlNotify;
    var array_crypto=[]
    console.log("Connected!");
    //gets crypto name from crypto currncy abreviation
    sqlNotify = "SELECT crypto_name FROM crypto ";
    let result = await con.query(sqlNotify)

    //gets crypto list (use only first case in case of extra data)
    result = result[0]

    //avalible currency on API and names that use
    
    let i = 0;

    //sends crypto to get API currency value and add it to the response
    for (let crypto_rta of result) {

      if (crypto_rta.crypto_name) {
         array_crypto.push(crypto_rta.crypto_name);
        //avoids adding %2C at the end
        if (i != result.length - 1) {
          string_crypto += crypto_rta.crypto_name + "%2C"
        }
        else
          string_crypto += crypto_rta.crypto_name

      }
      i++
    }

    var response =  config.api_exchange_simple + string_crypto + '&vs_currencies=USD%2CEUR'
    response = await axios.get(response)
  console.log(response)
  } catch (error) {
    console.log(error)

  }
  //saves response in external variable
  cryptos_array_base = response
  return response

}

//gets crypto name and currency from the follows of the user
async function selectCryptoToUser(user_id) {
  let rta = ""
  let stringMoneda = ""

  try {
    //run sql to get crypto name and currency from the follows of the user
    let sqlcurrency = "SELECT crypto_name, currency_pair FROM follow WHERE  (user_id='" + user_id + "')";
    let resultCurrency = await con.query(sqlcurrency)
    //gets only first value in case of extra data
    resultCurrency = await resultCurrency[0]
    //gest currency that the user use for his/her follows
    currency_pair = "" + resultCurrency[0].currency_pair;
    stringMoneda = stringMoneda + "currency: " + currency_pair

    // value of cryptos from external list use on notify()
    const keys = Object.keys(cryptos_array_base.data)

    const currency_keys = Object.keys(cryptos_array_base.data.bitcoin)
    //organize values for presentacion on telegram chat 
    for (let key of keys) {
      for (let datas of resultCurrency) {

        let name = datas.crypto_name

        if (key == name) {
          for (let currency_key of currency_keys) {
            if (currency_key == currency_pair.toLowerCase()) {
              stringMoneda = await stringMoneda + " \n " + name + " \n " + cryptos_array_base.data[key][currency_key];
            }
          }
        }
      }
    }
    rta =  " " + stringMoneda + "\n";
    return rta;


  }
  catch (err) {
    console.log(err)
  }


}

//runs sql for the user schedule and publish the currencys that every user follows to their chats
async function usersQuery(sql) {
  try {
    let users_array = []
    //sql for result
    console.log(sql + "outworks")
    //gets user_id and telegram_id from users table
    result = await con.query(sql)

    //checks if there are users and use first value of list in case of extra data
    if (result[0]) {
      //links every crypto to the user that follows it to send the currency
      for (let users of result[0]) {
        //gets message for notification depending of the follows of the user
        let notification = await selectCryptoToUser(users.user_id)
        //add tittle
        let message = "CRYPTO PRICES \ud83d\udcb8 \n" + notification
        console.log(message)
        message = {
          chat_id: users.telegram_id,
          message
        }
        // publish message on telegram
        if (message) {
           users_array.push(JSON.stringify(message))
           publishNotify(JSON.stringify(message))
        }
      }

    }

    // return may not be required (test on ambient first) MESSAGEDEV1
    return users_array
  }
  catch (err) {
    console.log(err)
  }
}
//schedule fuction that sends notification through other fuctions to the user of the service
async function schedule() {

  try {

    await notify()
    let users_array = []
    try {
      //gets user_id and telegram_id from users table
      let sql = "SELECT user_id, telegram_id FROM user ;"
      let array = await usersQuery(sql)
      //adds array to result as long as is not empty
      if (array && array !== null && array !== "null" && array.length > 0) {
         users_array.push(array)

      }

    }

    catch (error) { console.log(error) }

    // return may not be required (test on ambient first) MESSAGEDEV1
    return  users_array;
  }
  catch (err) {
    console.log(err)
  }
}

//schedule fuction that sends notification through other fuctions to the user of the service
endpoints.post('/exchange/crypto/priceActual', async (req, res) => {
 
    try {
      let string_crypto = req.body.crypto
      cryptos_array_base=[]
      //gets user_id and telegram_id from users table
      for (let valor of string_crypto) {
      let response =  config.api_exchange_simple + valor + '&vs_currencies=USD%2'
      response = await axios.get(response)
      console.log(response.data)
      cryptos_array_base.push({
        "name": valor,
        "price": response.data[valor]["usd"]
      })
      }
      
      //adds array to result as long as is not empty
      res.json(cryptos_array_base)
      res.end()
    }
    catch (error) { console.log(error) }

    // return may not be required (test on ambient first) MESSAGEDEV1

  }
)

//everytime is activated runs the fuctions to notify all users of actual the currecy prices they follow in an designated interval of time
endpoints.get('/exchange/crypto/notify/', async (req, res) => {
  try {
    await PromiseConnection();
    //ask for a periodical schedule to notify users
    res.json(await schedule())
    res.end()
  }
  catch (err) {
    console.log(err)
    res.json("internal fuction error")
    res.end()
  }

})


//gets prices of a crypto by petion of the user in a range of days 
endpoints.post('/exchange/crypto/price', async (req, res) => {
  console.log(req.body, "este es el body")
  try {
    await PromiseConnection();
    //date variables
    let actual_date = new Date()
    let date = new Date()
    //variables for cryptos
    let crypto = req.body.crypto
    let range = req.body.dateRange
    //URL to connect to API and fetch prices of the user 
    let url =  config.api_exchange_history + crypto + '/market_chart?vs_currency=USD&days=' + range + '&interval=daily'
    console.log(url)
    const response = await axios.get(url)
    //gets prices from url response
    const datos = response.data.prices
    //MESSAGEDEV2 test use on environment 
    const valores = datos

    const historic_price = []
    //converts date to oldest day in the range to start from there
    actual_date.setDate(actual_date.getDate() - valores.length + 1)
    //push values of historic prices on message
    for (let valor of valores) {
      //sets format of the date 
      date = date_format.format(actual_date, 'DD/MM/YYYY')
      //fix decimal values
      const valorGuardar = parseFloat(valor[1].toFixed(3))
      //push a historic value on the array 
      historic_price.push({
        "date": date,
        "price": valorGuardar
      }
      )

      //moves dates value to the next day of the range
      actual_date.setDate(actual_date.getDate() + 1)
    }
    //checks historic prices 
    console.log(historic_price)
    let message = {
      "name": crypto,
      "currency_pair": "USD",
      "historic_price": historic_price

    }
    console.log(message)
    //sends message to telegram
    res.json(message);
    res.end();

  } catch (error) {
    console.log(error)
  }

})
//creates/edit/deletes account of the database depending of the operation type and values sended 
//(can be implemented in other microservices without many changes)
endpoints.post('/exchange/accounts/event', async (req, res) => {
  try {
    //codificates message values
    const buff = Buffer.from(req.body.message.data, 'base64');
    const id = JSON.parse(buff.toString('utf-8'))
    console.log(id, "este es el body")
    await PromiseConnection();
    let sql

    try {
      //gets operation for switch cases
      var operation_type = id.operation_type
      console.log(operation_type);
    }
    catch (err) {
      res.json("invalid operation")
      res.end()
    }
    console.log("Connected!");
    let telegram_user_id = id.telegram_user_id
    //looks the operation asked for the user in the operation type string
    switch (operation_type) {
      //creates account using only the telegram id  and responds with success message
      case ("create"):
         sql = "INSERT INTO user (telegram_id) VALUES ('" + telegram_user_id + "');";
        result = await con.query(sql)
        await res.json({ "message": "account created" });

        break;
      //MESSAGEDEV3 CHECK IF THERE IS STILL NECESITY FOR THIS
      case ("update"):


        await res.json({ "message": "ok" });
        break;
      //deletes account using only the telegram id  and responds with success message
      case ("delete"):
         sql = "DELETE FROM user WHERE (telegram_id='" + telegram_user_id + "');";
        result = await con.query(sql)
        await res.json({ "message": "account deleted" });

        break;
      //if the event string doesnt match an operation returns error
      default:
        await res.json({ "error": "event not found" });

        break;
    }

    res.end()
  }
  catch (err) {
    console.log(err)
    await res.json("error")


    res.end()
  }
})


// Imports the Google Cloud client library
const { PubSub } = require('@google-cloud/pubsub');

// Creates a client; cache this for further use
const pubSubClient = new PubSub();
GOOGLE_APPLICATION_CREDENTIALS = '.\cryptobot-345516'
async function publishMessage(messaging) {
  try {
    // converts buffer from messaging
    const dataBuffer = Buffer.from(messaging);


    const messageId = await pubSubClient
      //topic data
      .topic("projects/cryptobot-345516/topics/accounts-events-topic")
      .publishMessage({ data: dataBuffer });

    console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
  }
}

async function publishNotify(messaging) {
  try {
    // converts buffer from messaging
    const dataBuffer = Buffer.from(messaging);


    const messageId = await pubSubClient
      //topic data
      .topic("projects/cryptobot-345516/topics/exchange-events-topic")
      .publishMessage({ data: dataBuffer });

    console.log(`Message ${messageId} published.`);
  } catch (error) {
    console.error(`Received error while publishing: ${error.message}`);
    process.exitCode = 1;
  }
}
module.exports = endpoints