const io = require('socket.io-client');
const sigUtil = require('eth-sig-util');
const ethUtil = require('ethereumjs-util');
const Web3 = require('web3');
const web3 = new Web3('https://kovan.infura.io')

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
          })
          .on('checkServerSignedData', ({signature, msgParams, from}) => {
            let recovered_address = sigUtil.recoverTypedSignature({ data: msgParams, sig: signature });
        
            if (ethUtil.toChecksumAddress(recovered_address) === ethUtil.toChecksumAddress(from)) {
                console.log('msgParams from server', msgParams);
                console.log('signature from server', signature);
                let sig = this.parseSignature(signature);
                console.log(`SERVER: SIGN FROM SERVER: recovered address ${recovered_address} and original address ${from} is equal`);
                console.log(`SERVER: signature
                r: ${sig.r} 
                s: ${sig.s} 
                v: ${sig.v}`);
            } 
            else {
                console.log(`recovered address ${recovered_address} and original address ${from} isn't equal`);
            }
        });
    }

    parseSignature(signature) {
        var r = signature.substring(0, 64);
        var s = signature.substring(64, 128);
        var v = signature.substring(128, 130);
    
        return {
            r: "0x" + r,
            s: "0x" + s,
            v: parseInt(v, 16)
        }
    }
    
    sendMessage(message) {
        this.socket.emit('sendMessage', message);
    }

    async help() {
        this.socket.emit('help');
    }

    async transfer() {
        this.socket.emit('transfer', {to: to, private_key: this.private_key, amount: amount});
    }

    async signData() {
        const msgParams = {types:{
            EIP712Domain:[
              {name:"name", type:"string"},
              {name:"version", type:"string"},
              {name:"chainId", type:"uint256"},
              {name:"verifyingContract", type:"address"}
            ],
            Person:[
              {name:"name", type:"string"},
              {name:"wallet", type:"address"}
            ],
            Message:[
              {name:"from", type:"Person"},
              {name:"to", type:"Person"},
              {name:"contents", type:"string"}
            ]
          },
          primaryType:"Message",
          domain:{name:"Test domain", version:"1", chainId:42, verifyingContract:"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"},
          message:{
            from:{name:"First account", wallet:"0xbCAD601Bf482A2c6986b23B62C9A773487188D0A"},
            to:{name:"Second account", wallet:"0x74353cEb5E36f10dE357F8791053C67764719346"},
            contents:"Hello from client"}
          }
        
          let privateKey = await Buffer.from(this.private_key, 'hex')
    
          let signature = await sigUtil.signTypedData(privateKey, {data: msgParams});
    
          let from = web3.eth.accounts.privateKeyToAccount('0x'+this.private_key).address;
          console.log('msgParams from client', msgParams);
          console.log('signature from client', signature);

          this.socket.emit('checkSignedData', {signature, msgParams, from});
    }

    async serverSignData() {
        this.socket.emit('serverSignData');
    }

    async getName() {
        this.socket.emit('getName');
    }

    async setName() {
        this.socket.emit('setName', this.private_key);
    }
}

module.exports = Client;
 