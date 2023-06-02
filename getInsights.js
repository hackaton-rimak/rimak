'use strict';
const mongodb = require("mongodb");
const lodash = require("lodash");

module.exports.handler = async (event) => {

    console.log("event", event);
    const body = JSON.parse(event.body);

    const client = await getClientMDB();
    let res = [];
    if(body.type === "question_average"){
        res = await client.collection("insights").aggregate([
            {
                $unwind: "$indicator"
            },
            {
                $group: {
                    _id: {
                        question: "$indicator.question",
                        day: { $dayOfMonth: { $toDate: "$createdAt" } },
                        month: { $month: { $toDate: "$createdAt" } },
                        year: { $year: { $toDate: "$createdAt" } }
                    },
                    averageValue: { $avg: "$indicator.value" },
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
        ]).toArray();
    }else{
        console.log("pass")
        let query = [{
            $match: { product: { $regex: new RegExp(`^${body.product}$`, 'i') } }
        }];

        if (lodash.get(body, "client", "") !== ""){
            query.push({$match: { client: body.client }})
        }
        try {
            res = await client.collection("insights").aggregate([
                    ...query,
                {
                    $project: {
                        sentiment: 1,
                        comment: 1,
                        product: 1,
                        day: { $dayOfMonth: { $toDate: "$createdAt" } },
                        month: { $month: { $toDate: "$createdAt" } },
                        year: { $year: { $toDate: "$createdAt" } }
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
                        count: { $sum: 1 },
                        comments: { $push: "$comment" }
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
            ]).toArray();

        }catch (e){
            console.log("ERR" , e)
        }
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
};

async function getClientMDB(dbName = `${process.env.MONGODB_DBNAME}`) {
    const mongo_uri = `${process.env.MONGO_URI}`;

    console.log("mongo_uri", mongo_uri, "db", `${process.env.MONGODB_DBNAME}`);
    const client = await mongodb.MongoClient.connect(mongo_uri);

    const db = await client.db(dbName);

    return db;
}
