var koa = require('koa');
var Router = require('koa-router');
var json = require('koa-json');
var SerialPort = require('serialport');
var mongo = require('mongodb');
var Server = mongo.Server;
var Db = mongo.Db;

var server = new Server('localhost',27017,{auto_reconnect:true});
var db = new Db('lora',server);

var app = koa();
var router = new Router();

var port = new SerialPort('/dev/ttyUSB0',{
        baudRate : 9600,
        parser: SerialPort.parsers.byteLength(10)
});

var dataNum = 0;
var dataMes = 0;
var num = 0;

port.on('open',function(){
  console.log('ok');
  port.on('data',function(data){
    dataNum = data.toString().split('\r');
    dataMes = dataNum[0].split("FF");
    num = parseInt(data.slice(9).toString("HEX"),16);
    console.log(num);
    db.open(function(err,db){
    if(!err){
      console.log("We are connected");
      db.collection('lora',function(err,collection){
		    var query_doc = {"ID" : Number(dataMes[0])};
		    collection.update(query_doc,{'$set':{"Data" : { "Heart" : dataMes[1],
                                                        "db" : parseInt(data.slice(9).toString("HEX"),16)},
                                                        "status" : true}});
        db.close();
        });
      }
    });
  });
});

app.use(json());
router.get('/LoRa',function * (){
  var jsonData = {"ID" : Number(dataMes[0]),
                  "Data" : {"Heart" : dataMes[1],
                            "db" : num},
                  "status" : true
                 };
  this.body = jsonData;
});

app.use(router.middleware());
app.listen(3000);
