'use strict';
const mongodb = require("mongodb");
const AWS = require('aws-sdk');
const moment = require('moment');
const lambda = new AWS.Lambda();

module.exports.handler = async (event) => {

    console.log("event", event);

    const sentiment_response = await getSentiment(event.comment);


    const client = await getClientMDB();

    const res = await client.collection("insights").insertOne({
        indicator: event.indicator,
        product: event.product,
        comment: event.comment,
        createdAt: moment().valueOf(),
        client: event.client,
        flow: event.flow,
        sentiment: sentiment_response.sentiment,
        sentimentPercentage: sentiment_response.sentimentPercentage,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: res,
            },
            null,
            2
        ),
    };

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};


async function getSentiment(comment){
    let params = {
        FunctionName: 'sentiment',
        InvocationType: 'RequestResponse',
        LogType: 'Tail',
        Payload: {text: comment},
    };

    const res = await lambda.invoke(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
        } else {
            console.log(data); // successful response
        }
    });

    return res;
}
async function getClientMDB(dbName = `${process.env.MONGODB_DBNAME}`) {
    const mongo_uri = `${process.env.MONGO_URI}`;

    console.log(mongo_uri, dbName)
    const client = await mongodb.MongoClient.connect(mongo_uri);

    const db = await client.db(dbName);

    return db;
}

// async function test(){
//     const client = await getClientMDB();
//     const res = await client.collection("rimak").find().toArray();
//
//     console.log('RES', res);
// }
//
// test();