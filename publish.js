const fetch = require('node-fetch');
require('dotenv/config');

const publish_message = function(user_id, pdfname, presignedUrl) {
    
    let data = `{"properties":{},"routing_key":"${user_id}","payload":"{'mypdf': '${pdfname}', 'url': '${presignedUrl}'}","payload_encoding":"string"}`;

    const username = 'pms02';
    const password = 'asdf12#$';

    fetch(`http://${process.env.RABBITMQ}/api/exchanges/dcs/dcs-exch-url/publish`, {
        method: 'POST',
        body: data,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`, 'binary').toString('base64')
        }
    })
    .then(res => console.log(res))
    .catch(err => console.log(err));

};

exports.publish_message = publish_message;