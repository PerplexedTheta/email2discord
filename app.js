const Fs = require('fs');
const Path = require('path');
const Http = require('http');
const Uuid = require('uuid');
const Mailparser = require('mailparser');
const Dayjs = require('dayjs');
const Os = require('os');

const { config: Config } = require(Path.resolve(__dirname, 'config.js'));
const { logger: Logger } = require(Path.resolve(__dirname, 'logger.js'));
const { discord: Discord } = require(Path.resolve(__dirname, 'discord.js'));

const config = new Config(Fs.readFileSync(Path.resolve(__dirname, 'config.yaml'), 'utf8'));
const logger = new Logger;
const discord = new Discord(config);

Http.createServer((request, response) => {
    let sessionStorage = {
        id: Uuid.v4(),
        mailData: {
            payload: '',
            messageId: '',
        },
        spoolData: {
            spoolDir: '',
            spoolFile: '',
        },
        requestData: {
            payload: '',
            size: 0,
        },
        responseData: {
            payload: {
                mailParseSuccess: false,
                spoolWriteSuccess: false,
                discordMessageSuccess: false,
            },
            size: 0,
        },
    };

    if(request.url != '/post_email' || request.method != 'POST') {
        response.setHeader('Content-Type', 'text/plain');
        response.statusCode = 403; response.statusMessage = 'Forbidden';
        sessionStorage.responseData.payload = 'Welcome to email2discord';

        logger._log_session(request, response, sessionStorage);
        response.end(sessionStorage.responseData.payload);
    } else {
        request
        .on('data', chunk => {
            sessionStorage.requestData.payload += chunk;
        })
        .on('end', () => {
            sessionStorage.requestData.size =
                Buffer.byteLength(sessionStorage.requestData.payload);

            Mailparser.simpleParser(sessionStorage.requestData.payload)
            .then(mail => {
                sessionStorage.mailData.payload = mail;
            })
            .then(() => {
                if (!(sessionStorage.mailData.payload.messageId))
                    throw 'content is not of type message/rfc822';
                else
                    sessionStorage.responseData.payload.mailParseSuccess = true;
            })
            .then(() => {
                sessionStorage.mailData.messageId =
                    sessionStorage.mailData.payload.messageId.match(/<(.+?)@/)[1];

                sessionStorage.spoolData.spoolDir =
                    config.spool.baseDir + '/' + Dayjs().format('YYYY-MM-DD');

                sessionStorage.spoolData.spoolFile =
                    sessionStorage.spoolData.spoolDir + '/' + sessionStorage.mailData.messageId + '.eml';
            })
            .then(() => {
                if (!Fs.existsSync(sessionStorage.spoolData.spoolDir))
                    Fs.mkdirSync(sessionStorage.spoolData.spoolDir, { recursive: true });

                if (Fs.existsSync(sessionStorage.spoolData.spoolFile))
                  Fs.unlinkSync(sessionStorage.spoolData.spoolFile);

                Fs.writeFileSync(sessionStorage.spoolData.spoolFile, sessionStorage.requestData.payload);

                sessionStorage.responseData.payload.spoolWriteSuccess = true;
            })
            .then(() => {
                if (sessionStorage.requestData.size > 10485759)
                    sessionStorage.spoolData.spoolFile = undefined;

                discord.sendMessage({
                    from: 'Mailer daemon at ' + Os.hostname(),
                    title: '*You\'ve got mail!',
                    content: 
                        'From: ' + sessionStorage.mailData.payload.from.text + "\n" +
                        'Subject: ' + sessionStorage.mailData.payload.subject + "\n" +
                        "\n" +
                        'A copy of this email is retained on the server for further reading' + "\n",
                    files: [sessionStorage.spoolData.spoolFile],
                });

                sessionStorage.responseData.payload.discordMessageSuccess = true;
            })
            .then(() => {
                response.setHeader('Content-Type', 'application/json');
                response.statusCode = 200; response.statusMessage = 'OK';

                logger._log_session(request, response, sessionStorage);
                response.end(JSON.stringify(sessionStorage.responseData.payload));
            })
            .catch(error => {
                response.setHeader('Content-Type', 'application/json');
                console.error({ error: error || 'Internal Server Error' });
                response.statusCode = 500; response.statusMessage = 'Internal Server Error';

                logger._log_session(request, response, sessionStorage);
                response.end(JSON.stringify({ error: error || 'Internal Server Error' }));
            });
        });
    }
})
.listen(config.server.port, config.server.address, () => {
    console.log(
        {
            status: 'listening',
            config: {
                server: config.server,
            },
        }
    );
});
