/* GET 'about us' page */
exports.about = function(req, res){
    res.render('generic-text', {
        title: 'About Loc8r',
        content: 'Loc8r was created to help people find places to sit down and get a little bit of work done.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc sed lorem ac nisi dignissim accumsan.'
    });
};

/* GET 'sign in' page */
exports.signin = function(req, res){
    res.render('signin-index', { title: 'Sign in' });
};