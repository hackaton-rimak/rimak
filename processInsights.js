'use strict';
const mongodb = require("mongodb");
const AWS = require('aws-sdk');
const moment = require('moment');
const lambda = new AWS.Lambda();

module.exports.handler = async (event) => {

    console.log("event", event);
    const body = JSON.parse(event.body);

    const sentiment_response = await getSentiment(body.comment);
    const sentiment_body = JSON.parse(JSON.parse(sentiment_response.Payload).body);

    const client = await getClientMDB();

    const res = await client.collection("insights").insertOne({
        indicator: body.indicator,
        product: body.product,
        comment: body.comment,
        createdAt: moment().valueOf(),
        client: body.client,
        flow: body.flow,
        sentiment: sentiment_body.sentiment,
        sentimentPercentage: sentiment_body.sentimentPercentage,
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
        FunctionName: 'rimak-dev-sentimentAnalisys',
        LogType: 'Tail',
        Payload:JSON.stringify({body: JSON.stringify({text: comment})}),
    };

    const res = await lambda.invoke(params).promise();

    return res;
}
async function getClientMDB(dbName = `${process.env.MONGODB_DBNAME}`) {
    const mongo_uri = `${process.env.MONGO_URI}`;

    const client = await mongodb.MongoClient.connect(mongo_uri);

    const db = await client.db(dbName);

    return db;
}
