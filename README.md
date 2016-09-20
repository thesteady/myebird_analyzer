"My eBird" Analyzer
===================

Hacking together a dashboard-y summary of personal data from ebird, which comes in via CSV.


## Development
- install dependencies with: `bower install`
- run `http-server ./` to run on `localhost:8080`. must be installed as npm module.


## Todo
  x map unique locations
  x how many times been to each location?
  - map marker color scale for # times at each

  - unique submissions:
    - how many hours birded? at each location and total
    - heat map of hours birded / day/month/year
    - graph of submissions over time

  - basic summaries: species, ticks, trips. by country/state/county


NEED TO HANDLE STRINGS WITH COMMAS IN THEM, eg.:
"Race Point Beach, Provincetown"
