const fetch = require('node-fetch');
require('dotenv/config');

const get_message = function(user_queue) {

    let data = {"count":5,"requeue":true,"encoding":"auto","truncate":50000};
    const username = 'pms02';
    const password = 'asdf12#$';

    fetch(`http://${process.env.RABBITMQ}/api/queues/dcs/${user_queue}/get`, {
        method: 'POST',
        body: JSON.stringify.data,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`, 'binary').toString('base64')
        }
    })
    .then(res => console.log(res))
    .catch(err => console.log(err));

};

exports.get_message = get_message;