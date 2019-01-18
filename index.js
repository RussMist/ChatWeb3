const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crypto = require('crypto');
const utils = require('./utils');


http.listen(3000, () => {
  console.log('listening on *:3000');
});

//Enter point in our app
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  //uid for connected user
  socket.user = {};
  socket.user.id = crypto.randomBytes(8).toString('hex');

  io.emit('sendMessage', `user ${socket.user.id} connected`);

  socket
  .on('disconnect', () => {
    io.emit('sendMessage', `user ${socket.user.id} disconnected`);
  })
  .on('sendMessage', (message) => {
    if (message.match(/!help/)) {
      socket.emit('sendMessage', `SERVER: <br/>!transfer :to :from :private_key :amount - transfer eth from one wallet to another<br/>
      !name - get current value of name<br/>
      !setname :from :private_key - set name with socket.name.id value<br/>
      !help - get help information`);
    } 
    else if (message.match(/!transfer (.+) (.+) (.+) (.+)/)) {
      let params = /!transfer (.+) (.+) (.+) (.+)/.exec(message);

      let to = params[1];
      let from = params[2];
      let private_key = params[3];
      let amount = params[4];
      
      try { 
        utils.sendTx({
          to: to,
          from: from,
          private_key: private_key,
          amount: amount
        }).then((reciept) => {
          socket.emit('sendMessage', `SERVER: ${socket.user.id}, your transaction is ${reciept.transactionHash}`);
        }); 
      }
      catch (exp) {
        socket.emit('sendMessage', `SERVER: EXCEPTION - ${exp.message}`);
      }

      socket.emit('sendMessage', `${socket.user.id}: ${message}`);
    } 
    else if (message.match(/!name/)) {
      try {
        utils.readSmartContract().then(value => {
          socket.emit('sendMessage', `SERVER: ${socket.user.id}, name is ${value}`);
        });
      } 
      catch (exp) {
        socket.emit('sendMessage', `SERVER: EXCEPTION - ${exp.message}`);
      }
      socket.emit('sendMessage', `${socket.user.id}: ${message}`);
    }
    else if (message.match(/!setname (.+) (.+)/)) {
      let params = /!setname (.+) (.+)/.exec(message);

      let from = params[1];
      let private_key = params[2];
      
      try { 
        utils.sendSmartContract({
          from: from,
          private_key: private_key,
          name: socket.user.id

        }).then((reciept) => {
          socket.emit('sendMessage', `SERVER: ${socket.user.id}, value is changed, TxHash is ${reciept.transactionHash}`);
        }); 
      }
      catch (exp) {
        socket.emit('sendMessage', `SERVER: EXCEPTION - ${exp.message}`);
      }

      socket.emit('sendMessage', `${socket.user.id}: ${message}`);
    } 
    else {
      io.emit('sendMessage', `${socket.user.id}: ${message}`);
    }  
  });
});
     

