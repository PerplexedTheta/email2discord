const logger = class {
    constructor() {}

    _log_session = ((request, response, sessionStorage) => {
        return console.dir(
            {
                request: {
                    url: request.url,
                    method: request.method,
                    userAgent: request.headers['user-agent'],
                    ipAddress: request.socket.remoteAddress,
                },
                response: {
                    statusCode: response.statusCode,
                    statusMessage: response.statusMessage,
                    sessionStorage: sessionStorage,
                },
            },
            {
                depth: null
	    },
        );
    });
};

// Export this module
// add class Logger as a property
// of module.exports
module.exports = { logger };
