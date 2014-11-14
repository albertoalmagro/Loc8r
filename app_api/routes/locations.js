var ctrl = require('../controllers/locations');

module.exports = function (app) {
    // Locations
    app.get('/api/locations', ctrl.locationsListByDistance);
    app.post('/api/locations', ctrl.locationsCreate);
    app.get('/api/locations/:locationid', ctrl.locationsReadOne);
    app.put('/api/locations/:locationid', ctrl.locationsUpdateOne);
    app.delete('/api/locations/:locationid', ctrl.locationsDeleteOne);

    // Reviews
    app.post('/api/locations/:locationid/reviews', ctrl.reviewsCreate);
    app.get('/api/locations/:locationid/reviews/:reviewid', ctrl.reviewsReadOne);
    app.put('/api/locations/:locationid/reviews/:reviewid', ctrl.reviewsUpdateOne);
    app.delete('/api/locations/:locationid/reviews/:reviewid', ctrl.reviewsDeleteOne);
};