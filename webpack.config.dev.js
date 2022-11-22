const base = require('./webpack.config.base');
const fs = require('fs');

module.exports = {
    devtool: 'source-map',
    mode: 'development',
    devServer: {
        server: {
            type: 'https',
            options: {
                key: fs.readFileSync('localhost-key.pem'),
                cert: fs.readFileSync('localhost.pem'),
            },
        },
        open: ['/'],
        static: {
            directory: 'build',
        },
    },
    ...base,
};
