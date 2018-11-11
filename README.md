# Vacasa Reservation Notifier

Vacasa allows owners to see new reservations via the Owner dashboard,
but they don't provide any way for owners to get notified when new
reservations are made.

This script is setup to communicate with the Vacasa API, watch for new
reservations, and send SMS messages to the property owner(s) when new
reservations are found.

# Setup

- `nvm install`
- `yarn install`
- `cp .env.template .env`

# Configuration

This script uses [dotenv](https://www.npmjs.com/package/dotenv) to load
configuration data.  The project setup includes a step to setup a
template `.env` file for further customization.  In this fashion, no
configuration data should be committed into source control.

The script uses [MongoDb](https://www.mongodb.com/) to store reservation
data.  You need to configure a MongoDB database, and expose the
configured URL as `MONGODB_URI` in the `.env` file.

Additionally, this script uses [Twilio](https://www.twilio.com/) to send
SMS messages.  You need to setup an Twilio account and then enter your
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM` in the
`.env` file.

Lastly, you need to provide your relevant Vacasa configuration in order
for things to work.  Your `VACASA_USERNAME` and `VACASA_PASSWORD` are
the values you entered when you setup your account.  The `API_KEY`,
`VACASA_OWNER_ID` and `VACASA_UNIT_ID` are a little more difficult to
get.  The easiest way is to use a network inspector (Chome's Network
tab) to look at the XHR requests to extract the information you need.

The API key is provided as a request header when you login.  Open the
Chrome Inspector while you're at the Vacasa owner login page.  Login,
and then look for the request to
`https://api.vacasa.com/v1/owners/auth`.  The API key is the second
segment of the `Authorization` request header.  For example:

```
Authorization: Bearer API_KEY
```

The owner ID and unit ID are part of the API request to get your current
reservations.  The URL is formated like so:

```
https://api.vacasa.com/v1/owners/VACASA_OWNER_ID/units/VACASA_UNIT_ID/reservations
```

# Operation

## `node check.js`

Primary flow. Checks for new reservations and sends
notifications.

## `node truncate.js`

Clear out all reservations from the MongoDB collection.  Useful for
debugging purposes or if something went wrong.
