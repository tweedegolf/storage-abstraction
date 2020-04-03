# ADAPTER

- create storage class
- create storage config type
- add config type to StorageConfig type
- add new cloud service to url parser

# TODO

- fileExists()
- options generic {} => responsibility for correct keys and values is up to user
- optional library dependencies
- adapter classes in separate repo's so you can add only the adapter you need
- adapter classes should define their config type and url parse methods

# BLOG

- We live in a cloud-world
- You don't want to code to vendor-specific API's but to a single vendor-transparent adapter layer
- Ideally you don't want to write vendor-specific code to avoid vendor lock-in and to allow for easy switching to another/better cloud service
