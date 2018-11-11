require('dotenv').config();

const dt = require('node-datetime');
const rp = require('request-promise');
const twilio = require('twilio');
const Promise = require('bluebird');

const connectDb = require('./src/connect-db');

const authUrl = `${process.env.API_HOST}/v1/owners/auth`;

(async function() {
  const twilioClient = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  const { client, collection, err: dbError } = await connectDb();

  if (dbError) {
    console.log(err.stack);
    process.exit();
  }

  const authResp = await rp({
    url: authUrl,
    method: 'POST',
    json: true,
    body: {
      data: {
        login_type: 'owner',
        username: process.env.VACASA_USERNAME,
        password: process.env.VACASA_PASSWORD,
      },
    },
    headers: {
      Authorization: `Bearer ${process.env.API_KEY}`,
    },
  });

  const authToken = authResp.data.token;
  const today = dt.create().format('Y-m-d');
  const reservationsUri = `${process.env.API_HOST}/v1/owners/${process.env.VACASA_OWNER_ID}/units/${process.env.VACASA_UNIT_ID}/reservations`

  const reservationResp = await rp({
    uri: reservationsUri,
    qs: {
      'filter[unit]': process.env.VACASA_UNIT_ID,
      'filter[current_date]': today,
      'sort': 'FirstNight',
    },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    json: true,
  });

  await Promise.all(reservationResp.data.map(async (reservation) => {
    const records = await collection.find({ id: reservation.id }).toArray();

    if (records.length === 0) {
      // new record found
      console.log('new record found');
      try {
        await collection.insertOne(reservation);
      } catch(err) {
        console.log(err);
      }
    } else {
      // skip - no-op
    }
  }));

  client.close();
})();




// `${process.env.API_HOST}/v1/owners/${process.env.VACASA_OWNER_ID}/units/${process.env.VACASA_UNIT_ID}/reservations?filter[unit]=${process.env.VACASA_UNIT_ID}&filter[current_date]=2018-11-11&sort=FirstNight`
