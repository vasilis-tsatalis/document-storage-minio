const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: '13.81.39.210',
    port: 9000,
    useSSL: false,
    accessKey: 'pms02',
    secretKey: 'asdf12#$'
});

module.exports = minioClient;