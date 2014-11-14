"use strict";
var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var theEarth = (function () {
    var earthRadius = 6371; // Kms

    var getDistanceFromRads = function (rads) {
        return parseFloat(rads * earthRadius);
    };

    var getRadsFromDistance = function (distance) {
        return parseFloat(distance / earthRadius);
    };

    return {
        getDistanceFromRads : getDistanceFromRads,
        getRadsFromDistance : getRadsFromDistance
    };
})();

var getProcessedLocations = function (results) {
    var locations = [];
    results.forEach(function (doc) {
        locations.push({
            distance: theEarth.getDistanceFromRads(doc.dis),
            name: doc.obj.name,
            address: doc.obj.address,
            rating:  doc.obj.rating,
            facilities: doc.obj.facilities,
            _id: doc.obj._id
        });
    });
    return locations;
};

var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

// Locations
module.exports.locationsCreate = function (req, res) {
    sendJSONresponse(res, 200, {"status" : "success"});
};

module.exports.locationsListByDistance = function (req, res) {
    var lng = parseFloat(req.query.lng);
    var lat = parseFloat(req.query.lat);
    var maxDistance = parseFloat(req.query.maxDistance) || 20;
    var point = {
        type: "Point",
        coordinates: [lng, lat]
    };
    var geoOptions = {
        spherical: true,
        maxDistance: theEarth.getRadsFromDistance(maxDistance),
        num: 10
    };
    if(!lng || !lat) {
        sendJSONresponse(res, 404, {
            "message": "lng and lat query parameters are required"
        });
        return;
    }
    Loc.geoNear(point, geoOptions, function (err, results, stats) {
        var locations = [];
        if (err) {
            sendJSONresponse(res, 404, err);
        } else {
            locations = getProcessedLocations(results);
            sendJSONresponse(res, 200, locations);
        }
    });
};

module.exports.locationsReadOne = function (req, res) {
    if (req.params && req.params.locationid) {
        Loc.findById(req.params.locationid)
            .exec(function (err, location) {
                if (!location) {
                    sendJSONresponse(res, 404, {
                        "message" : "locationid not found"
                    });
                    return;
                } else if (err) {
                    sendJSONresponse(res, 404, err);
                    return;
                }
                sendJSONresponse(res, 200, location);
            });
    } else {
        sendJSONresponse(res, 404, {
            "message" : "No locationid in request"
        });
    }
};

module.exports.locationsUpdateOne = function (req, res) {
    sendJSONresponse(res, 200, {"status" : "success"});
};

module.exports.locationsDeleteOne = function (req, res) {
    sendJSONresponse(res, 200, {"status" : "success"});
};

// Reviews
module.exports.reviewsCreate = function (req, res) {
    sendJSONresponse(res, 200, {"status" : "success"});
};

module.exports.reviewsReadOne = function (req, res) {
    if (req.params && req.params.locationid && req.params.reviewid) {
        Loc.findById(req.params.locationid)
            .select('name reviews')
            .exec(function (err, location) {
                var response, review;
                if (!location) {
                    sendJSONresponse(res, 404, {
                        "message" : "locationid not found"
                    });
                    return;
                } else if (err) {
                    sendJSONresponse(res, 404, err);
                    return;
                }
                if (location.reviews && location.reviews.length > 0) {
                    review = location.reviews.id(req.params.reviewid);
                    if (!review) {
                        sendJSONresponse(res, 404, {
                            "message" : "reviewid not found"
                        });
                    } else {
                        response = {
                            location: {
                                name : location.name,
                                id : req.params.locationid
                            },
                            review : review
                        };
                        sendJSONresponse(res, 200, response);
                    }
                } else {
                    sendJSONresponse(res, 404, {
                        "message" : "No reviews found"
                    });
                }
            });
    } else {
        sendJSONresponse(res, 404, {
            "message" : "Not found, locationid and reviewid are required"
        });
    }
};

module.exports.reviewsUpdateOne = function (req, res) {
    sendJSONresponse(res, 200, {"status" : "success"});
};

module.exports.reviewsDeleteOne = function (req, res) {
    sendJSONresponse(res, 200, {"status" : "success"});
};

