/* GET 'home' page */
exports.homelist = function (req, res) {
    res.render('locations-list', { title: 'Home' });
};

/* GET 'Location info' page */
exports.locationInfo = function (req, res) {
    res.render('location-info', { title: 'Location Info' });
};

/* GET 'Add review' page */
exports.addReview = function (req, res) {
    res.render('location-review-form', { title: 'Add review' });
};