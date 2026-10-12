# The Road Home

A night-time motorway map of the hard feelings everyone drives through. Anxiety, low mood, exams and work, traffic, relationships, parenting and the urge to escape are all motorways. Every hard feeling is a junction, every sign carries a reframe, and all roads lead home.

![The Road Home](docs/map-preview.png)

## What is in it

- **The map.** Seven motorways run in from the edges of the map. Their junctions are blue road signs, each with a short reframe printed underneath ("Burnout: change the load"). Anxiety, Pressure and Family tangle at Spaghetti Junction (Overwhelm). Four A-road shortcuts link feelings that travel together: A3AM Sleepless, A1ONE Isolation, A830 School Run and A90 Short Fuse. Every motorway crosses the Kindness Orbital, where the brown "worth visiting" signs are, and finishes at Home.
- **Moving traffic.** Headlights flow along every road towards Home. The Anxiety lane is fast and jittery, Low Mood crawls, and Gridlock is stop start.
- **Satnav.** Pick your junction. It plans the route with the fewest junctions and changes, lists every sign on the way, and then drives it on the map while a satnav bar reads each reframe aloud. The Low Mood and Heart roads dip before they climb, on purpose.
- **Road furniture with a job.** A variable message sign cycles kind messages ("QUEUE AHEAD / IT WILL PASS"). Hazard signs mark fog and roadworks. Orange SOS phones open crisis help.
- **Poster capture.** An email form unlocks the full-size SVG poster (prints sharp at A2 or A1) and a print-to-PDF version.
- **Crisis signposting** on Rock Bottom, Heartbreak, the SOS phones, the poster and the footer (Samaritans 116 123, SHOUT 85258).

## The roads

| Road | Covers | Starts at | Orbital junction |
| --- | --- | --- | --- |
| M1 Anxiety | Anxiety and worry | What If? | Breathe |
| M2 Low Mood | Depression and low mood | Heavy Mornings | Reach Out |
| M3 Pressure | Exams, study and work | Deadline | Rest |
| M4 Gridlock | Traffic, commuting and waiting | Traffic Jam | Out of Your Hands |
| M5 Heart | Relationships | Loneliness | Forgiveness |
| M6 Family | Children and parenting | Back Seat Meltdown | Patience |
| M7 Escape | When you need a way out | Get Me Out of Here | Stillness |
| Kindness Orbital | Healing, from anywhere | Rings Home | Kindness Services |

## Editing the map

Everything lives in `public/index.html`. The `NODES` object holds each junction's name, its on-sign reframe (`sub`), the panel copy (`feel` and `gap`) and its position on a 1600 x 1200 canvas. Orbital junctions take an angle (`ang`) instead. The `ROADS` object lists the junctions each road passes through, in order, and you can drop in `[x, y]` waypoints to bend a road. Signs place themselves automatically to avoid roads and each other, so you can add or move junctions without hand-placing labels.

## Running it

Zero dependencies. Node 18 or newer.

```bash
npm start            # http://localhost:3000
```

| Env var | What it does |
| --- | --- |
| `PORT` | Port to listen on (Railway sets this for you) |
| `DATA_DIR` | Folder for `subscribers.jsonl` (default `./data`). Mount a Railway volume here so sign-ups survive redeploys. |
| `SUBSCRIBE_WEBHOOK_URL` | Optional. Each sign-up is also POSTed here as JSON, so you can pipe it into ConvertKit, Mailchimp, Zapier or Make. |

Endpoints: `GET /health`, `POST /api/subscribe` (`{ "email": "...", "name": "..." }`).

## Deploying to Railway

Create a new project from this repo. Railway detects the `start` script and sets `PORT`. Add a volume mounted at `/data`, set `DATA_DIR=/data`, and optionally set `SUBSCRIBE_WEBHOOK_URL`.

The Road Home is a reflection tool. It is not medical advice and does not replace a GP, therapist or counsellor.
