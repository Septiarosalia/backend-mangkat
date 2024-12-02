const { getDataConnect, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'backend-mangkat',
  location: 'asia-southeast2'
};
exports.connectorConfig = connectorConfig;

