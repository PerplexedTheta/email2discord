const Yaml = require('yaml');

const config = class {
    constructor(configPath) {
        try {
            return Yaml.parse(configPath);
        } catch(error) {
            console.error({ error: error });
        }
    }
};

// Export this module
// add class Logger as a property
// of module.exports
module.exports = { config };
