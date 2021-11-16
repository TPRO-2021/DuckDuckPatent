module.exports = {
    devServer: {
        // add proxy rewrite to enable development on localhost
        proxy: {
            '^/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                logLevel: 'debug',
                pathRewrite: { '^/api': '/' },
            },
        },
    },
};
