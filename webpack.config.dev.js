const base = require('./webpack.config.base');

module.exports = {
    devtool: 'source-map',
    mode: 'development',
    devServer: {
        https: true,
        open: ['/'],
        static: {
            directory: 'build',
        },
    },
    ...base,
};
