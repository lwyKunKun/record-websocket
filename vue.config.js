const IS_PROD = ["production", "prod"].includes(process.env.NODE_ENV);
const { resolve } = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const CompressionWebpackPlugin = require("compression-webpack-plugin");

module.exports = {
    publicPath: "./",
    //打包位置
    outputDir: "dist",
    // 放置生成的静态资源 (js、css、img、fonts) 的 (相对于 outputDir 的) 目录
    assetsDir: "static",
    // 指定生成的 index.html 的输出路径 (相对于 outputDir),也可以是一个绝对路径
    indexPath: "index.html",
    //关闭Eslink校验
    lintOnSave: false,
    //服务器配置
    devServer: {
        port: 3333, // 端口号
        https: false,
        open: false,
        overlay: {
            //关闭Eslink校验
            warnings: false,
            errors: true,
        },
        // proxy: {
        //     "/Api": {
        //         target: "http://182.140.140.35:8085",
        //         pathRewrite: {
        //             "^/Api": "",
        //         },
        //         changeOrigin: true, //是否允许跨域
        //     },
        // },
    },
    css: {
        extract: IS_PROD, // 是否使用css分离插件 ExtractTextPlugin
        sourceMap: !IS_PROD, // 开启 CSS source maps?
        loaderOptions: {
            postcss: {
                plugins: [
                    require("autoprefixer")({
                        overrideBrowserslist: [
                            "Android 4.1",
                            "iOS 7.1",
                            "Chrome > 31",
                            "ff > 31",
                            "ie >= 8",
                            //'last 2 versions', // 所有主流浏览器最近2个版本
                        ],
                    }),
                ],
            },
        },
    },
    configureWebpack: (config) => {
        // 开发生产共同配置别名
        Object.assign(config.resolve, {
            alias: {
                "@": resolve("src"),
            },
        });

        if (IS_PROD) {
            /* 打包清除console和debugger */
            config.optimization = {
                minimizer: [
                    new TerserPlugin({
                        terserOptions: {
                            compress: {
                                warnings: false,
                                drop_debugger: true,
                                drop_console: true,
                            },
                        },
                    }),
                ],
            };
            config.plugins = [
                ...config.plugins,
                // gzip配置 依赖服务器(nginx)配置
                new CompressionWebpackPlugin({
                    algorithm: "gzip", // 使用gzip压缩
                    test: /\.js$|\.html$|\.css$/, // 匹配文件名
                    filename: "[path].gz[query]", // 压缩后的文件名(保持原文件名，后缀加.gz)
                    minRatio: 0.8, // 压缩率小于0.8才会压缩
                    threshold: 10240, // 对超过10k的数据压缩
                    deleteOriginalAssets: false, // 是否删除未压缩的源文件，谨慎设置，如果希望提供非gzip的资源，可不设置或者设置为false（比如删除打包后的gz后还可以加载到原始资源文件）
                }),
            ];
        }
    },

    productionSourceMap: false, // 生产环境关闭sourcemap
    //热更新
    chainWebpack: (config) => {
        // 修复HMR
        config.resolve.symlinks(true);
    },
};