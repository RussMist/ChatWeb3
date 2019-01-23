# Test chat with web3.js

### Installation
```sh
$ npm install
$ node index
```
Next step: go to http://localhost:3000

In chat use command:

| Command | Description |
| ------ | ------ |
| !help | Get help information |
| !name | Get current value of name |
| !transfer :to :private_key :ammount | Transfer eth from one wallet to another |
| !setname :private_key | Set name with socket.name.id value |
| !sign | Sign data with eth_signTypedData_v3, send to server for verification and get server sign for verification on client side |
| !serverSign | Sign data from server side and get/verivicate it on client side |

Example:
```sh
!sign
!serverSign
!setname 22F68CA75BAD383C494F80215422FC0750A4930977E037ED0727FDFFA6F755EA
!transfer 0xF3dc91939DC7E46B64AE764ED7AE89032bdc1293 22F68CA75BAD383C494F80215422FC0750A4930977E037ED0727FDFFA6F755EA 0.001
```

### Test
```sh
$ node index
$ node test
```