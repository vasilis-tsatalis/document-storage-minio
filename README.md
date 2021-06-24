# document-storage-minio
Document system using minio &amp; open whisk

# Environment Parameters
./.env.example

# Install NodeJS Application dependancies
$ cd document-storage-minio
$ npm install

# Run Mailhog as docker image to send email
$ docker run -p 8025:8025 -p 1025:1025 mailhog/mailhog

# Run Application
$ node server.js

# Wordcount javaScript file will run in FaaS Platform 
# and it will be called as an endpoint with a post request
$ wsk action update wordcount wordcount.js --web true
$ wsk api create /wordcount /calculator post wordcount --response-type http
$ curl http://13.81.39.210:3233/api/v1/web/guest/default/wordcount

# Messaging System
$ http://20.86.146.181:5000/queues/<output-queue>
