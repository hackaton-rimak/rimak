'use strict';
const lodash = require("lodash");
const {aggregate} = require("../gateway/MongoGateway");
const {COLLECTION} = require("../constants/collection");


async function getInsights(event) {
    const body = JSON.parse(event.body);
    let res = [];
    if (body.type === "question_average") {
        res = await aggregate([
            {
                $unwind: "$indicator"
            },
            {
                $group: {
                    _id: {
                        question: "$indicator.question",
                        day: {$dayOfMonth: {$toDate: "$createdAt"}},
                        month: {$month: {$toDate: "$createdAt"}},
                        year: {$year: {$toDate: "$createdAt"}}
                    },
                    averageValue: "$indicator.value",
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                    "_id.day": 1
                }
            },
            {
                $group: {
                    _id: "$_id.question",
                    dates: {
                        $push: {
                            date: {
                                day: "$_id.day",
                                month: "$_id.month",
                                year: "$_id.year"
                            },
                            averageValue: "$averageValue"
                        }
                    }
                }
            },
            {
                $sort: {
                    "_id": 1
                }
            }
        ],COLLECTION.insights);
    } else {
        let query = [{
            $match: {product: {$regex: new RegExp(`^${body.product}$`, 'i')}}
        }];

        if (lodash.get(body, "client", "") !== "") {
            query.push({$match: {client: body.client}})
        }
        res = await aggregate([
            ...query,
            {
                $project: {
                    sentiment: 1,
                    comment: 1,
                    product: 1,
                    day: {$dayOfMonth: {$toDate: "$createdAt"}},
                    month: {$month: {$toDate: "$createdAt"}},
                    year: {$year: {$toDate: "$createdAt"}}
                }
            },
            {
                $group: {
                    _id: {
                        day: "$day",
                        month: "$month",
                        year: "$year",
                        product: "$product",
                        sentiment: "$sentiment"
                    },
                    count: {$sum: 1},
                    comments: {$push: "$comment"}
                }
            },
            {
                $group: {
                    _id: {
                        day: "$_id.day",
                        month: "$_id.month",
                        year: "$_id.year",
                        product: "$_id.product"
                    },
                    sentiments: {
                        $push: {
                            sentiment: "$_id.sentiment",
                            count: "$count",
                            comments: "$comments"
                        }
                    }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1,
                    "_id.day": 1
                }
            }
        ], COLLECTION.insights);
    }


    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                data: res,
            },
            null,
            2
        ),
    };
}

module.exports = {
    getInsights
}
