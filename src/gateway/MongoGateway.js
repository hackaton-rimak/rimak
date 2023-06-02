const mongodb = require("mongodb");

async function insertOne(collection, data){
    const client = await getClient();

    return client.collection(collection).insertOne(data);
}
async function aggregate(aggregateQuery, collection){
    const client = await getClient();

    return client.collection(collection).aggregate(aggregateQuery).toArray();
}

async function getClient(dbName = `${process.env.MONGODB_DBNAME}`) {
    const mongo_uri = `${process.env.MONGO_URI}`;

    const client = await mongodb.MongoClient.connect(mongo_uri);

    return client.db(dbName);
}


module.exports = {
    insertOne,
    aggregate
}