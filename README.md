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

TODO:

figure out where I'm parsing data incorrectly in unique-ing submissions vs. species.

seems to have problems with 22 species --> 22 times visited, then reports overage of hours spent.