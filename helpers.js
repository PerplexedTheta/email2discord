const helpers = class {
    constructor() {}

    _truncateText = ((text, length) => {
        length = length - 3;
        if (text.length < length)
            return text;

        return text.substr(0, length) + '...';
    });
};

// Export this module
// add class Helpers as a property
// of module.exports
module.exports = { helpers };
