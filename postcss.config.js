module.exports = {
    plugins: [
        require('postcss-discard-comments'),
        require('postcss-nested'),
        require('postcss-import'),
        require('postcss-simple-vars'),
        require('postcss-mixins'),
        require('postcss-extend-rule')
    ]
};