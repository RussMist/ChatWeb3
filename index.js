const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const utils = require('./utils');

const help_info = `SERVER: <br/>!transfer :to :private_key :amount - transfer eth from one wallet to another<br/>
!name - get current value of name<br/>
!setname :private_key - set name with socket.name.id value<br/>
!help - get help information`;

http.listen(3000, () => {
  console.log('listening on *:3000');
});

//Enter point in our app
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  io.emit('sendMessage', `user ${socket.id} connected`);

  socket
  .on('disconnect', () => {
    io.emit('sendMessage', `user ${socket.id} disconnected`);
  })
  .on('sendMessage', (message) => {
      io.emit('sendMessage', `${socket.id}: ${message}`); 
  })
  .on('help', () => {
    socket.emit('serverAnswer', help_info);
  })
  .on('getName', () => {
      try {
        utils.readSmartContract().then(value => {
          socket.emit('serverAnswer', `SERVER: ${socket.id}, name is ${value}`);
        });
      } 
      catch (exp) {
        console.log(exp);
        socket.emit('error', `SERVER: EXCEPTION - ${exp.message}`);
      }
    }
  )
  .on('setName', (private_key) => {
    try { 
      utils.sendSmartContract({
        private_key: private_key,
        name: socket.id

      }).then((reciept) => {
        socket.emit('serverAnswer', `SERVER: ${socket.id}, value is changed, TxHash is ${reciept.transactionHash}`);
      }); 
    }
    catch (exp) {
      socket.emit('error', `SERVER: EXCEPTION - ${exp.message}`);
    }
  }
)
.on('transfer', ({to, private_key, amount}) => {
    try { 
      utils.sendTx({
        to: to,
        private_key: private_key,
        amount: amount
      }).then((reciept) => {
        socket.emit('serverAnswer', `SERVER: ${socket.id}, your transaction is ${reciept.transactionHash}`);
      }); 
    }
    catch (exp) {
      socket.emit('error', `SERVER: EXCEPTION - ${exp.message}`);
    }
  })
  .on('signData', (private_key) => {
    utils.signData_V3(private_key).then((data) => {
      socket.emit('serverAnswer', `SERVER: ${socket.id}, signed data is 
      </br>r:${data.r}, 
      </br>s:${data.s}, 
      </br>v:${data.v}`);
    });
  });
});
