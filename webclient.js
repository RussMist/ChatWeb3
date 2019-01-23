const socket = io();
const sigUtil = require('eth-sig-util');
const ethUtil = require('ethereumjs-util');

const regex = {
    help: /!help/,
    getName: /!name/,
    setName: /!setname (.+)/,
    transfer: /!transfer (.+) (.+) (.+)/,
    signData: /!sign/,
    serverSignData: /!serverSign/
}

function parseSignature(signature) {
	var r = signature.substring(0, 64);
	var s = signature.substring(64, 128);
	var v = signature.substring(128, 130);
  
	return {
		r: "0x" + r,
		s: "0x" + s,
		v: parseInt(v, 16)
	}
}


const signData_V3 = function() {
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

    let from = web3.eth.accounts[0];
    let method = 'eth_signTypedData_v3';

    web3.currentProvider.sendAsync({
    method: method,
    params: [from, JSON.stringify(msgParams)],
    from: from,
    }, function(err, result) {
    
        if (err) {
            return console.error(err);
        }
        if (result.error) {
            return console.error(result.error.message);
    }

    let signature = result.result;

    console.log('msgParams from client', msgParams);
    console.log('signature from client', signature);

    socket.emit('checkSignedData', {signature, msgParams, from})});

};

$(function () {
    $('form').submit(function(e){
    e.preventDefault();

    let message = $('#message').val();

    if(message.length == 0) {
        return false;
    }

    socket.emit('sendMessage', message);

    if(message.match(regex.help)) {
        socket.emit('help');
    }
    else if(message.match(regex.getName)) {
        socket.emit('getName');
    }
    else if(message.match(regex.transfer)) {
        let params = regex.transfer.exec(message);

        let to = params[1];
        let private_key = params[2];
        let amount = params[3];

        socket.emit('transfer', {to, private_key, amount});
    }
    else if(message.match(regex.setName))
    {
        let params = regex.setName.exec(message);

        let private_key = params[1];

        socket.emit('setName', private_key);
    }
    else if(message.match(regex.signData)) {
        signData_V3();
    }
    else if(message.match(regex.serverSignData)) {
        socket.emit('serverSignData');
    }

    $('#message').val('');
    return false;
    });
});

socket
.on('sendMessage', (msg) => { 
    $('#messages').append($('<li>').html(msg));
})
.on('serverAnswer', (msg) => {
    $('#messages').append($('<li style="color: green">').html(msg.replace (/\n/g, '<br/>')));
})
.on('checkServerSignedData', ({signature, msgParams, from}) => {
    let recovered_address = sigUtil.recoverTypedSignature({ data: msgParams, sig: signature });

	if (ethUtil.toChecksumAddress(recovered_address) === ethUtil.toChecksumAddress(from)) {
        console.log('msgParams from server', msgParams);
        console.log('signature from server', signature);
        let sig = parseSignature(signature);
        $('#messages').append($('<li style="color: blue">').html(`SERVER: SIGN FROM SERVER: recovered address ${recovered_address} and original address ${from} is equal`));
        $('#messages').append($('<li style="color: blue">').html(`SERVER: signature</br>r: ${sig.r} <br/>s: ${sig.s} <br/>v: ${sig.v}`));
	} 
	else {
		console.log(`recovered address ${recovered_address} and original address ${from} isn't equal`);
	}
})
.on('error', (error) => {
    $('#messages').append($('<li style="color: red">').html(msg));
});