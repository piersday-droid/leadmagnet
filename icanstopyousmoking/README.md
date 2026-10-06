# icanstopyousmoking.com

A one-page stop smoking site for Piers Day. Zero dependencies: plain Node.js, no packages to install.

## Run it locally

    node server.js

Then open http://localhost:3000

## Deploy on Railway

1. In Railway, create a new project and choose "Deploy from GitHub repo". Pick this repository and set the root directory to `icanstopyousmoking`.
2. Railway detects `package.json` and runs `npm start`. There is nothing to build.
3. Under the service's Variables, add the contact details (all optional; any left out simply hide their button):
   - `PHONE` the number to show and call, for example `07700 900123`
   - `WHATSAPP` the same number in international format, digits only, for example `447700900123`
   - `BOOKING_URL` the Calendly link for the stop smoking session
4. Under Settings, then Networking, add the custom domain `icanstopyousmoking.com` (and `www.icanstopyousmoking.com`). Railway shows the DNS records to add at your domain registrar.
5. Health check path: `/health`

## Editing the words

All the text is in `public/index.html`. The page reads the contact details from the Railway variables above, so the phone number never needs to be typed into the page itself.

## Before it goes live

Check the wording against the ASA and CAP guidance on hypnotherapy advertising, and keep a simple record of stop smoking clients and follow-ups so the "one in twelve" figure can be backed up if anyone asks.
