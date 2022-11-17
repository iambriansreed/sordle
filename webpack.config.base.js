const path = require('path');
const RemovePlugin = require('remove-files-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const AsyncDeployPlugin = require('./asyncDeployPlugin');

module.exports = {
    entry: {
        main: './src/main.ts',
    },
    output: {
        publicPath: '',
        path: path.join(__dirname, 'build'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            outputPath: '',
                            name: '[name].css',
                        },
                    },
                    'sass-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new RemovePlugin({
            before: {
                include: ['./build'],
            },
        }),
        new CopyPlugin({
            patterns: [{ from: 'public', to: '' }],
        }),
        new AsyncDeployPlugin(),
    ],
};
