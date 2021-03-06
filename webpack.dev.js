 const merge = require('webpack-merge');
 const common = require('./webpack.config.js');
 const fs = require('fs');

 module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './public',
        https:{
            key: fs.readFileSync('server.key'),
            cert: fs.readFileSync('bundle.crt')
        },
        disableHostCheck:true,
        allowedHosts:[
        'dev1.cogenicintel.com',
        'localhost'
        ],
        writeToDisk: true
    },
    });
