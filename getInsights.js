'use strict';
const mongodb = require("mongodb");

module.exports.handler = async (event) => {

    console.log("event", event);
    const body = JSON.parse(event.body);

    const client = await getClientMDB();
    const res = await client.collection("insights").find({product: body.product}).toArray();

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
