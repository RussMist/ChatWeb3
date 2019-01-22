const Client = require('./client');

const client1 = new Client('F7CB63F305A91F75D3EAF3152B35F9FDC45F935133C7A51ED63E1CE6DD699477');
const client2 = new Client('22F68CA75BAD383C494F80215422FC0750A4930977E037ED0727FDFFA6F755EA');

client1.getName();
client2.setName();
setTimeout(function() {client2.getName();}, 15000);

