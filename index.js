$(function() {
  var map = L.map('map').setView([39.73, -104.99], 8);
  window.map = map;

  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  $('#upload-csv').click(function(e) {
    $.ajax({
      url: './data/data_two.csv',
      method: 'GET',
      dataType: 'text',
      success: function(data) {
        return processData(data);
        //TODO: also hide/show selector buttons (dont show if no data)
      }
    });
  });

  $('.count-type-selector').click(function(e) {
    var $btn = $(e.currentTarget);
    var countType = $btn.data("type");
    var filter;

    if(countType == "stationary") {
      filter = "eBird - Stationary Count";
    } else if (countType == "traveling") {
      filter = "eBird - Traveling Count";
    } else {
      // no filter, show all data.
      filter = undefined;
      // TODO: figure out how unfiltering works
    }
    //filter data based on count type
    filteredData = turf.filter(data, "countType", filter);
    L.geoJson(filteredData, {style: {
      "color": "green"
    }}).addTo(map);
  });

  function processData(data) {
    var parsedData = parseCSV(data); //headers, records
    var uniqueSubmissions = getUniqueChecklists(parsedData.records);
    var featureCollection = convertToGeoJSON(uniqueSubmissions);
    window.data = featureCollection;

    addDataToMap(featureCollection);
    showPointCount(featureCollection.features);
    addTotalTimeSpent(uniqueSubmissions);
    addSpeciesCount(uniqueSubmissions);
    // addBufferToMap(featureCollection); // -- turfjs playing
  }


  //playing with turf js.
  // function addBufferToMap(featureCollection) {
  //   //makes a buffer of the first point w 1 mile radius and adds to map.
  //   var buffer = turf.buffer(featureCollection.features[0], 1, 'miles');
  //   L.geoJson(buffer).addTo(map);
  // }

  function getUniqueChecklists(records) {
    var submissions = _.groupBy(records, function(record) {
      return record["Submission ID"]
    });

    var fixedSubmissions = _.mapObject(submissions, function(submissionRecords, submissionId) {
      //create a new submission record here
        var newObj = _.clone(submissionRecords[0])

        //add all the species to the object
        newObj.species = _.map(submissionRecords, function(record) {
          return {
            commonName: record["Common Name"],
            scientificName: record["Scientific Name"],
            count: record.count
          }
        });

        //clean up the object so it doesnt have data from the
        // first species still floating confusingly
        delete newObj["Common Name"]
        delete newObj["Scientific Name"]
        delete newObj.count
        delete newObj["Species Comments"]
        delete newObj["Breeding Code"]
        delete newObj["Taxonomic Order"]

        return newObj
    });
    return _.values(fixedSubmissions);
  }

  // info box functions----------------------------------------------------------

  function addSpeciesCount(uniqueSubmissions) {
    var count = _.uniq(_.pluck(_.flatten(_.pluck(uniqueSubmissions, "species")), "commonName")).length
    $('#species-count .js-data').html(count);
  }

  function addTotalTimeSpent(uniqueSubmissions) {
    // this number doesn't seem right....
    var total = _.reduce(uniqueSubmissions, function(duration, submission) {
      return duration + submission.durationMin
    },0)

    var duration = convertMinutesToPrettyFormatTime(total);
    var str = ['<p>You have spent ', duration, ' birding.</p>'].join('');

    $('#duration .js-data').html(str);
  }

  function showPointCount(points) {
    $('#num-places .js-data').html(points.length);
  };

// mapping functions---------------------------------------------------------------

  function addDataToMap(data) {
    var locationsLayer = L.geoJson(data,{
      onEachFeature: addPopupContent
    }).addTo(map);
  };

  function addPopupContent(feature, layer) {
    var content = popUpContent(
      feature.properties.name,
      feature.properties.visitCount,
      feature.properties.duration,
      feature.properties.species.length
    )
    layer.bindPopup(content);
  };

  function popUpContent(name, visitCount, duration, speciesCount) {
    var prettyTime = convertMinutesToPrettyFormatTime(duration);
    var pluralizedVisits = visitCount > 1 ? " times " : " time ";
    var prettyVisits = [visitCount, pluralizedVisits].join("")
    return [
      '<h3>', name, '</h3><p>You\'ve been here ', prettyVisits,
      'and have spent ', prettyTime,' birding here.</p>',
      '<p>You\'ve seen ', speciesCount, ' species here.</p>'
    ].join('');
  };
});
