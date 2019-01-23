const Web3 = require('web3');
const EthereumTx = require('ethereumjs-tx');
const sigUtil = require('eth-sig-util');
const ethUtil = require('ethereumjs-util');

const web3 = new Web3('https://kovan.infura.io')
const CONTRACT_HASH = '0x623c871cbc9934ca7dda19ba1539c3ee98ba2557';
const SERVER_PRIVATE_KEY = 'E6BFA56A591E18329DBE5815B8A3DB5B9C01788DFCA1D6008F877FCAACCCBCEB';

const ABI = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "_name",
				"type": "string"
			}
		],
		"name": "setName",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "_name",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"name": "",
				"type": "string"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]

const myContract = new web3.eth.Contract(ABI, CONTRACT_HASH);

async function sendTx({to, private_key, amount = '0', data = '0x00', gasLimit = '31000'}) {
	let privateKey = await Buffer.from(private_key, 'hex')
	let from = web3.eth.accounts.privateKeyToAccount('0x'+private_key).address;

    let nonce = await web3.eth.getTransactionCount(from)

    let gasPrice = web3.utils.toWei('3', 'gwei')
    let ethAmount = web3.utils.toWei(amount)
    let txParams = {
        nonce: web3.utils.toHex(nonce),
        gasPrice: web3.utils.toHex(gasPrice), 
        gasLimit: web3.utils.toHex(gasLimit),
        to: to, 
        value: web3.utils.toHex(ethAmount), 
        data: data,
        chainId: 42
    }
    let tx = new EthereumTx(txParams)
    tx.sign(privateKey)
    let serializedTx = tx.serialize()

    return web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'));
}

async function sendSmartContract({private_key, name}) {
    let gasLimit = await myContract.methods.setName(name).estimateGas();
	let data = await myContract.methods.setName(name).encodeABI();
	
    return sendTx({
        to: CONTRACT_HASH,
		private_key: private_key,
        data: data,
        gasLimit: gasLimit
	});
}

async function readSmartContract() {    
    return myContract.methods.name().call();
}

async function signData() {
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
		contents:"Hello from server"}
	  }
	
	  let privateKey = await Buffer.from(SERVER_PRIVATE_KEY, 'hex')

	  let signature = await sigUtil.signTypedData(privateKey, {data: msgParams});

	  let from = web3.eth.accounts.privateKeyToAccount('0x'+SERVER_PRIVATE_KEY).address;

	  console.log('signature from server', signature);
	  console.log('msgParams from server', msgParams);
	  
	  return {
		  signature: signature,
		  msgParams: msgParams,
		  from: from
	  }
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

async function checkSignedData({signature, msgParams, from}) {
	let recovered_address = sigUtil.recoverTypedSignature({ data: msgParams, sig: signature });
	console.log('signature from client', signature);
	console.log('msgParams from client', msgParams);
	let isEqual;
	if (ethUtil.toChecksumAddress(recovered_address) === ethUtil.toChecksumAddress(from)) {
		console.log(`recovered address ${recovered_address} and original address ${from} is equal`);
		isEqual = true;
	} 
	else {
		console.log(`recovered address ${recovered_address} and original address ${from} isn't equal`);
		isEqual = false;
	}

	return {isEqual: isEqual, recovered_address: recovered_address, signature: parseSignature(signature)}
};

module.exports.sendTx = sendTx;
module.exports.sendSmartContract = sendSmartContract;
module.exports.readSmartContract = readSmartContract;
module.exports.signData = signData;
module.exports.parseSignature = parseSignature;
module.exports.checkSignedData = checkSignedData;