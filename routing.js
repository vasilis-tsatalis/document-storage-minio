const fetch = require('node-fetch');
require('dotenv/config');

const create_routing = function(user_id, user_queue) {

    let data = {"routing_key": `${user_id}` };
    const username = 'pms02';
    const password = 'asdf12#$';

    fetch(`http://${process.env.RABBITMQ}/api/bindings/dcs/e/dcs-exch-url/q/${user_queue}`, {
        method: 'POST',
        body: JSON.stringify.data,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`, 'binary').toString('base64')
        }
    })
    //.then(res => console.log(res))
    .catch(err => console.log(err));

};

exports.create_routing = create_routing;