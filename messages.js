const fetch = require('node-fetch');
require('dotenv/config');

const get_message = function(user_queue) {

    let req_body = `{"count":100,"requeue":"true","encoding":"auto","truncate":50000}`;
    const username = 'pms02';
    const password = 'asdf12#$';

    fetch(`http://${process.env.RABBITMQ}/api/queues/dcs/${user_queue}/get`, {
        method: 'POST',
        body: req_body,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`, 'binary').toString('base64')
        }
    })
    .then( response => response.json() )
    .then( response => {
        response.forEach(item => {
            //console.log(item.payload);
            const thedata = item.payload;
            const newdata = thedata.replace(/'/g, '"');
            const mydata = JSON.parse(newdata);
            console.log(mydata);
            console.log('----------------------')
            //return mydata;
        })
    } )
    .catch(err => console.log(err));

};

exports.get_message = get_message;