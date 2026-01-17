const connectWithConnector = require('./connector');

let knexInstance;

const getKnexInstance = async () => {
    if(!knexInstance) {
        knexInstance = await connectWithConnector();
    }
    return knexInstance
};

module.exports = getKnexInstance;