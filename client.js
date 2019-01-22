const io = require('socket.io-client');

class Client {
    constructor(private_key) {
        this.socket = io('http://localhost:3000');

        this.private_key = private_key;

        this.socket.on('sendMessage', (msg) => {
           console.log(msg);
          })
          .on('serverAnswer', (msg) => {
            console.log(msg)
          })
          .on('error', (error) => {
            console.error(error)
          });
    }

    sendMessage(message) {
        this.socket.emit('sendMessage', message);
    }

    help() {
        this.socket.emit('help');
    }

    transfer() {
        this.socket.emit('transfer', {to: to, private_key: this.private_key, amount: amount});
    }

    signData() {
        this.socket.emit('signData', this.private_key);
    }

    getName() {
        this.socket.emit('getName');
    }

    setName() {
        this.socket.emit('setName', this.private_key);
    }
}

module.exports = Client;
 