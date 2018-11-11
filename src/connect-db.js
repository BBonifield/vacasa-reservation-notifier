const MongoClient = require('mongodb').MongoClient;

async function connectDb() {
  let client, db, collection;

  try {
    const dbName = process.env.MONGODB_URI.split('/').pop();

    const client = await MongoClient.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
    const db = client.db(dbName);
    const collection = db.collection('reservations');

    return { client, db, collection };
  } catch (err) {
    return { err };
  }
}

module.exports = connectDb;
