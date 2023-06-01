'use strict';
const mongodb = require("mongodb");

module.exports.handler = async (event) => {

    console.log("event", event);
    const body = JSON.parse(event.body);

    const client = await getClientMDB();
    const res = await client.collection("insights").aggregate([
        {
            $match: { product: body.product }
        },
        {
            $project: {
                sentiment: 1,
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
                count: { $sum: 1 }
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
                        count: "$count"
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

    const client = await mongodb.MongoClient.connect(mongo_uri);

    const db = await client.db(dbName);

    return db;
}
