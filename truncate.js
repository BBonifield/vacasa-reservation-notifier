require('dotenv').config();

const connectDb = require('./src/connect-db');

(async function() {
  console.log('Truncating');

  const { client, db, err: dbError } = await connectDb();

  if (dbError) {
    console.log(err.stack);
    process.exit();
  }

  try {
    await db.dropCollection('reservations');
  } catch(err) {
    console.log(err);
  }

  console.log('Done');
  client.close();
})();
