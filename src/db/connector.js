const knex = require('knex');
const { Connector } = require('@google-cloud/cloud-sql-connector');

const getIPType = () =>
    process.env.PRIVATE_IP === '1' || process.env.PRIVATE_IP === 'true'
        ? 'PRIVATE'
        : 'PUBLIC';

const connectWithConnector = async config => {
    const connector = new Connector();
    const clientOptions = await connector.getOptions({
        instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME,
        ipType: getIPType()
    });

    const dbConfig = {
        client: 'pg',
        connection: {
            ...clientOptions,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        },
        ...config
    };

    return knex(dbConfig);
};

module.exports = connectWithConnector;