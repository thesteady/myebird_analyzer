$(function() {
  var map = L.map('map').setView([39.73, -104.99], 9);
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
    // parseCSV data for unique submissions
    // - do i add the species data to each unique submission?
    // use unique submissions to get total duration, total distance covered.
    // use unique submissions to get unique locations
    // calculate number of times at each location
    // convert to json.
    var parsedData = parseCSV(data); //headers, records
    var uniqueSubmissions = getUniqueChecklists(parsedData.records);
    var featureCollection = convertToGeoJSON(uniqueSubmissions);
    window.data = featureCollection;

    addDataToMap(featureCollection);
    // addBufferToMap(featureCollection); // -- turfjs playing
    showPointCount(featureCollection.features);
    addTotalTimeSpent(uniqueSubmissions);
    addSpeciesCount(uniqueSubmissions);
  }


  //playing with turf js.
  // function addBufferToMap(featureCollection) {
  //   //makes a buffer of the first point w 1 mile radius and adds to map.
  //   var buffer = turf.buffer(featureCollection.features[0], 1, 'miles');
  //   L.geoJson(buffer).addTo(map);
  // }

  function getUniqueChecklists(records) {
    var checklistIdList = [];
    var uniqueChecklists = [];
    var checklist;
    _.each(records, function(record) {
      var checklistId = record["Submission ID"];
      if (_.contains(checklistIdList, checklistId)) {
        // not a unique submission, so find existing submission
        checklist = _.find(uniqueChecklists, function(list) {
          return list["Submission ID"] == checklistId;
        });
      } else {
        // is a new checklistId
        checklist = _.clone(record);
        checklist.species = [];
      }

      checklist.species.push({
        commonName: record["Common Name"],
        scientificName: record["Scientific Name"],
        count: record["Count"]
      });

      uniqueChecklists.push(checklist);
      checklistIdList.push(checklistId)
    });
    return uniqueChecklists;
  }

  // info box functions

  function addSpeciesCount(uniqueSubmissions) {
    var count = _.uniq(_.pluck(_.flatten(_.pluck(uniqueSubmissions, "species")), "commonName")).length
    $('#species-count .js-data').html(count);
  }

  function addTotalTimeSpent(uniqueSubmissions) {
    var total = _.reduce(uniqueSubmissions, function(duration, submission) {
      return duration + submission["Duration (Min)"]
    },0)

    var duration = convertMinutesToPrettyFormatTime(total);
    var str = ['<p>You have spent ', duration, ' birding.</p>'].join('');

    $('#duration .js-data').html(str);
  }

  function showPointCount(points) {
    $('#num-places .js-data').html(points.length);
  };

  // map functions

  function addDataToMap(data) {
    var locationsLayer = L.geoJson(data,{
      onEachFeature: addPopupContent
    }).addTo(map);
  };

  function addPopupContent(feature, layer) {
    var props = feature.properties;
    layer.bindPopup(popUpContent(props.name, props.visitCount, props.duration, props.speciesCount));
  };

  function popUpContent(name, visitCount, duration, speciesCount) {
    var prettyTime = convertMinutesToPrettyFormatTime(duration);
    var pluralizedTimes = visitCount > 1 ? " times " : " time ";

    return [
    '<h3>', name, '</h3><p>You\'ve been here ', visitCount, pluralizedTimes,
    'and have spent ', prettyTime,' birding here.</p><p>You have seen ', speciesCount, ' species here.</p>'
    ].join('');
  };
});
