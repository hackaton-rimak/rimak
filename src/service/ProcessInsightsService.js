const {FUNCTIONS} = require("../constants/functions");
const {insertOne} = require("../gateway/MongoGateway");
const moment = require('moment');
const AWS = require("aws-sdk");
const {COLLECTION} = require("../constants/collection");
const lambda = new AWS.Lambda();

async function processInsights(event){
    const body = typeof event.body == "string" ? JSON.parse(event.body):event.body;

    const sentiment_response = await getSentiment(body.comment);
    const sentiment_body = JSON.parse(JSON.parse(sentiment_response.Payload).body);


    const res = await insertOne(COLLECTION.insights, {
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

}

async function getSentiment(comment){
    let params = {
        FunctionName: FUNCTIONS.analysis,
        LogType: 'Tail',
        Payload:JSON.stringify({body: JSON.stringify({text: comment})}),
    };

    return lambda.invoke(params).promise();
}

module.exports = {
    processInsights
}