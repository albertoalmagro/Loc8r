/* GET 'about us' page */
exports.about = function(req, res){
    res.render('index', { title: 'About us' });
};

/* GET 'sign in' page */
exports.signin = function(req, res){
    res.render('signin-index', { title: 'Sign in' });
};