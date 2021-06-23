const fetch = require('node-fetch');
require('dotenv/config');

const create_output = function(user_queue) {

    let data = `{"auto_delete":"false","durable":"true","arguments":{},"node":"rabbit@pms02vm1"}`;
    const username = 'pms02';
    const password = 'asdf12#$';

    fetch(`http://${process.env.RABBITMQ}/api/queues/dcs/${user_queue}`, {
        method: 'PUT',
        body: data,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`, 'binary').toString('base64')
        }
    })
    .then(res => console.log(res))
    .catch(err => console.log(err));

};

exports.create_output = create_output;