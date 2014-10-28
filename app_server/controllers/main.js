/* GET 'about us' page */
exports.about = function(req, res){
    res.render('generic-text', { title: 'About us' });
};

/* GET 'sign in' page */
exports.signin = function(req, res){
    res.render('signin-index', { title: 'Sign in' });
};