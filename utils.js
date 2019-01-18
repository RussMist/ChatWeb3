const Web3 = require('web3');
const EthereumTx = require('ethereumjs-tx');
const web3 = new Web3('https://kovan.infura.io')
const CONTRACT_HASH = '0x623c871cbc9934ca7dda19ba1539c3ee98ba2557';

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

async function sendTx({to, from, private_key, amount = '0', data = '0x00', gasLimit = '31000'}) {
    let privateKey = await Buffer.from(private_key, 'hex')

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


async function sendSmartContract({from, private_key, name}) {
    let gasLimit = await myContract.methods.setName(name).estimateGas();
	let data = await myContract.methods.setName(name).encodeABI();
	
    return sendTx({
        to: CONTRACT_HASH,
		from: from,
		private_key: private_key,
        data: data,
        gasLimit: gasLimit
	});
}

async function readSmartContract() {    
    return myContract.methods.name().call();
}

module.exports.sendTx = sendTx;
module.exports.sendSmartContract = sendSmartContract;
module.exports.readSmartContract = readSmartContract;