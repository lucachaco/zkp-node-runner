module.exports = {
rpc: {
host:"localhost",
port:8545
},
networks: {
development: {
host: "localhost", //our network is running on localhost
port: 8545, // port where your blockchain is running
network_id: "*",
from: "0x0c1c28336f5f256bd6657215f00ee83121e51336", // use the account-id generated during the setup process
}
}
}
