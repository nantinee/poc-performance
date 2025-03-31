#Docker does not allow direct IOPs limitation, but you can use --device-write-bps & --device-read-bps 
```docker run -d \
  --memory="1.7g" \
  --cpus="0.5" \
  --device-write-bps /dev/sda:30mb \
  --device-read-bps /dev/sda:30mb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  mongo:6.0```
# call api
curl -X POST http://localhost:3000/test-express          
curl -X POST http://localhost:4000/test-fastify# poc-performance
