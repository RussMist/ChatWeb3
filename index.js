const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const utils = require('./utils');
const express = require('express');

const help_info = `SERVER:
!transfer :to :private_key :amount - transfer eth from one wallet to another
!name - get current value of name
!setname :private_key - set name with socket.name.id value
!sign - sign data with eth_signTypedData_v3
!serverSign - sign data from server
!help - get help information`;

http.listen(3000, () => {
  console.log('listening on *:3000');
});

app.use('/public', express.static('public'));

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
  .on('serverSignData', () => {
    utils.signData().then(({signature, msgParams, from}) => {
      socket.emit('checkServerSignedData', {signature, msgParams, from});
    });
  })
  .on('checkSignedData', ({signature, msgParams, from}) => {
    utils.checkSignedData({signature, msgParams, from}).then(({isEqual, recovered_address, signature}) => {
      if(isEqual) {
        socket.emit('serverAnswer', `SERVER: ${socket.id} sign is correct,
        signature:
        r: ${signature.r},
        s: ${signature.s}, 
        v: ${signature.v};
        recovered address ${recovered_address} and original address ${from} is equal`);

        utils.signData().then(({signature, msgParams, from}) => {
          socket.emit('checkServerSignedData', {signature, msgParams, from});
        });
      } 
      else {
        socket.emit('serverAnswer', `SERVER: ${socket.id} sign isn't correct,
        signature:
        r: ${signature.r},
        s: ${signature.s},
        v: ${signature.v};
        recovered address ${recovered_address} and original address ${from} isn't equal`);
      }
    });
  });
});
