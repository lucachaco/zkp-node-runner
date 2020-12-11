const configJson = require('easy-node-config');

const config = configJson(`/app/src/config/config.json`);

module.exports = config;
