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

var doAddReview = function(req, res, location) {
    if (!location) {
        sendJSONresponse(res, 404, {
            "message" : "locationid not found"
        });
    } else {
        location.reviews.push({
            author: {
                displayName: req.body.author
            },
            rating: req.body.rating,
            reviewText: req.body.reviewText
        });
        location.save(function (err, location) {
            var thisReview;
            if (err) {
                sendJSONresponse(res, 404, err);
            } else {
                updateAverageRating(location._id);
                thisReview = location.reviews[location.reviews.length -1];
                sendJSONresponse(res, 201, thisReview);
            }
        });
    }
};

var updateAverageRating = function (locationid) {
    Loc.findById(locationid)
        .select('rating reviews')
        .exec(function (err, location) {
            if (!err) {
                doSetAverageRating(location);
            }
        });
};

var doSetAverageRating = function (location) {
    var i, reviewCount, ratingAverage, ratingTotal;
    if (location.reviews && location.reviews.length > 0) {
        reviewCount = location.reviews.length;
        ratingTotal = 0;
        for (i = 0; i < reviewCount; i++) {
            ratingTotal = ratingTotal + location.reviews[i].rating;
        }
        ratingAverage = parseInt(ratingTotal / reviewCount, 10);
        location.rating = ratingAverage;
        location.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Average rating updated to ", ratingAverage);
            }
        });
    }
};

var sendJSONresponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

// Locations
module.exports.locationsCreate = function (req, res) {
    Loc.create({
        name: req.body.name,
        address: req.body.address,
        facilities: req.body.facilities.split(','),
        coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
        openingTimes: [{
            days: req.body.days1,
            opening: req.body.opening1,
            closing: req.body.closing1,
            closed: req.body.closed1
        }, {
            days: req.body.days2,
            opening: req.body.opening2,
            closing: req.body.closing2,
            closed: req.body.closed2
        }]
    }, function (err, location) {
        if (err) {
            sendJSONresponse(res, 404, err);
        } else {
            sendJSONresponse(res, 201, location);
        }
    });
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
    if (!req.params.locationid) {
        sendJSONresponse(res, 404, {
            "message" : "Not found, locationid is required"
        });
        return;
    }
    Loc.findById(req.params.locationid)
        .select('-reviews -rating')
        .exec(function (err, location) {
            if (!location) {
                sendJSONresponse(res, 404, {
                    "message" : "locationid not foundt"
                });
                return;
            } else if (err) {
                sendJSONresponse(res, 400, err);
                return;
            }
            location.name = req.body.name;
            location.address = req.body.address;
            location.facilities = req.body.facilities.split(',');
            location.coords = [parseFloat(req.body.lng), parseFloat(req.body.lat)];

            location.openingTimes = [{
                days: req.body.days1,
                opening: req.body.opening1,
                closing: req.body.closing1,
                closed: req.body.closed1
            }, {
                days: req.body.days2,
                opening: req.body.opening2,
                closing: req.body.closing2,
                closed: req.body.closed2
            }];

            location.save(function (err, location) {
                if (err) {
                    sendJSONresponse(res, 404, err);
                } else {
                    sendJSONresponse(res, 200, location);
                }
            });
        });
};

module.exports.locationsDeleteOne = function (req, res) {
    sendJSONresponse(res, 200, {"status" : "success"});
};

// Reviews
module.exports.reviewsCreate = function (req, res) {
    if (req.params && req.params.locationid) {
        Loc.findById(req.params.locationid)
            .select('reviews')
            .exec(function (err, location) {
                if (err) {
                    sendJSONresponse(res, 404, err);
                } else {
                    doAddReview(req, res, location);
                }
            });
    } else {
        sendJSONresponse(res, 404, {
            "message" : "No locationid in request"
        });
    }
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
    if (!req.params.locationid || !req.params.reviewid ) {
        sendJSONresponse(res, 404, {
            "message" : "Not found, locationid and reviewid are both required"
        });
        return;
    }
    Loc.findById(req.params.locationid)
        .select('reviews')
        .exec(function (err, location) {
            var thisReview;
            if (!location) {
                sendJSONresponse(res, 404, {
                    "message" : "locationid not found"
                });
                return;
            } else if (err) {
                sendJSONresponse(res, 400, err);
                return;
            }
            if (location.reviews && location.reviews.length > 0) {
                thisReview = location.reviews.id(req.params.reviewid);
                if (!thisReview) {
                    sendJSONresponse(res, 404, {
                        "message" : "reviewnid not found"
                    });
                } else {
                    thisReview.author.displayName = req.body.author;
                    thisReview.rating = req.body.rating;
                    thisReview.reviewText = req.body.reviewText;
                    location.save(function(err, location) {
                        if (err) {
                            sendJSONresponse(res, 404, err);
                        } else {
                            updateAverageRating(location._id);
                            sendJSONresponse(res, 200, thisReview);
                        }
                    });
                }
            } else {
                sendJSONresponse(res, 404, {
                    "message" : "No review to update"
                });
            }
        });
};

module.exports.reviewsDeleteOne = function (req, res) {
    sendJSONresponse(res, 200, {"status" : "success"});
};

