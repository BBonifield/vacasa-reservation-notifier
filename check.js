require('dotenv').config();

const rp = require('request-promise');
const twilio = require('twilio');
const Promise = require('bluebird');
const moment = require('moment');

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
  const today = moment().format('YYYY-MM-DD');
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
      console.log('New reservation found');

      const startDate = moment(reservation.attributes.start_date);
      const endDate = moment(reservation.attributes.end_date);
      const nights = endDate.diff(startDate, 'days');
      const pricePerNight = (parseFloat(reservation.attributes.total_rent) / nights.toFixed(2)).toFixed(2);

      const smsTargets = process.env.SMS_TARGETS.split(',');
      const body = `${reservation.attributes.first_name} is getting cozy!\n` +
        `New booking for ${nights} nights @ ${pricePerNight > 0 ? pricePerNight : 'free'}/night!\n` +
        `Start date: ${startDate.format('dddd, MMMM Do')}\n` +
        `End date: ${endDate.format('dddd, MMMM Do')}\n` +
        `Gross rent: $${reservation.attributes.total_rent}`;

      await Promise.all(smsTargets.map(async (smsTarget) => {
        try {
          await twilioClient.messages.create({
            body: body,
            to: smsTarget,
            from: process.env.TWILIO_FROM,
          });
        } catch(err) {
          console.log('Encountered error:', err);
        }
      }));

      await collection.insertOne(reservation);
    }
  }));

  client.close();
})();
