const Minio = require('minio');
require('dotenv/config');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_HOST,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: 'pms02',
    secretKey: 'asdf12#$'
});

module.exports = minioClient;