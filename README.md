# document-storage-minio
Document system using minio &amp; open whisk

# Run Mailhog as docker image to send email
$ docker run -p 8025:8025 -p 1025:1025 mailhog/mailhog

# Wordcount javaScript file will run in FaaS Platform 
# and it will be called as an endpoint with a post request
$ wsk action update wordcount wordcount.js --web true
$ wsk api create /wordcount /calculator post wordcount --response-type http
$ curl http://${APIHOST}:9001/api/${GENERATED_API_ID}/wordcount/calculator

# Run Application
$ node server.js
