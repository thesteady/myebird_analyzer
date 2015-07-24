$(function() {
  var map = L.map('map').setView([39.73, -104.99], 9);

  L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);


  $.ajax({
    url: './data/test_data.csv',
    method: 'GET',
    dataType: 'text',
    success: function(data) {
      // parseCSV data for unique submissions
      // - do i add the species data to each unique submission?
      // use unique submissions to get total duration, total distance covered.
      // use unique submissions to get unique locations
      // calculate number of times at each location
      // convert to json.

      var parsedData = parseCSV(data);
      var uniqueSubmissions = getUniqueSubmissions(parsedData);

      var geoJSON = convertToGeoJSON(uniqueSubmissions);

      addDataToMap(geoJSON);
      showPointCount(geoJSON);
      addTotalTimeSpent(uniqueSubmissions);
      addSpeciesCount(uniqueSubmissions)
    }
  });

  function parseCSV(data) {
    var rows = $.trim(data).split('\n');
    var headers = rows.shift(1).split(',');

    return {
      headers: headers,
      records: rows
    };
  }

  function getUniqueSubmissions(data) {
    var headers = data.headers;
    var records = data.records;

    var cols = {
      submissionId: headers.indexOf('Submission ID'),
      state: headers.indexOf('State/Province'),
      county: headers.indexOf('County'),
      location: headers.indexOf('Location'),
      lat: headers.indexOf('Latitude'),
      lon: headers.indexOf('Longitude'),
      duration: headers.indexOf('Duration (Min)')
    }

    var speciesCols = {
      commonName: headers.indexOf('Common Name'),
      count: headers.indexOf('Count')
    }

    var subIDList = [];
    var uniqueSubmissions = [];

    //loop through each record in the CSV
    for (var i = 0; i < records.length; i++) {

      var record = records[i].split(',');
      var submissionID = record[cols.submissionId];

      //only if a new submission
      if (subIDList.indexOf(submissionID) === -1) {
        var submission = _formatSubmission(record, cols);
        submission = _addSpeciesAndCountToSubmissions(submission,record, speciesCols)

        uniqueSubmissions.push(submission);
        subIDList.push(submissionID);
      } else {
        // update the species list for that record

        // find obj to update
        //TODO: underscorify
        var obj = $(uniqueSubmissions).filter(function(i, submission) {
          return submission.submissionId === submissionID
        })[0];
        //add species for this record
        _addSpeciesAndCountToSubmissions(obj, record, speciesCols);
      }
    }

    return uniqueSubmissions;
  }

  function _addSpeciesAndCountToSubmissions(obj, record, speciesCols) {

    _.each(speciesCols, function(value, key) {
      obj.species[key] = record[value]
    })

    return obj
  }

  function _formatSubmission(record, cols) {
    var obj = {};

    _.each(cols, function(value, key) {
      if( _.includes(['lat', 'lon'], key) ) {
        obj[key] = parseFloat(record[value])
      }else if(key === 'duration'){
        obj[key] = parseInt(record[value])
      } else {
        obj[key] = record[value]
      }
    });

    obj.species = []

    return obj;
  }

  function addSpeciesCount(uniqueSubmissions) {
    //go through

    var str = "92";
    $('#species-count .js-data').html(str);
  }

  function addTotalTimeSpent(uniqueSubmissions) {
    var duration = 0;

    for(var i = 0; i < uniqueSubmissions.length; i++) {
      duration += uniqueSubmissions[i].duration
    }

    var total = _.reduce(uniqueSubmissions, function(duration, submission) {
      duration += submission.duration;
      return duration;
    })

    duration = convertMinutesToPrettyFormatTime(total);
    var str = ['<p>You have spent ', duration, ' birding.</p>'].join('');

    $('#duration .js-data').html(str);
  }

  function convertMinutesToPrettyFormatTime(minutes) {
    var hours = minutes / 60;
    var days = hours / 24;

    if(hours < 1) {
      return [minutes, ' minutes'].join('');
    } else if (days < 1) {
      return [hours, ' hours'].join(''); //convert to minutes, hours
    }else {
      return [days, ' days'].join('');
    }
  }

  function convertToGeoJSON(submissions) {
    var locationsList = [];
    var points = [];

    for(var i = 0; i < submissions.length; i++) {
      var submission = submissions[i];

      if(locationsList.indexOf(submission.location) === -1) {
        points.push(createPoint(submission));
        locationsList.push(submission.location)
      } else {

        var point = $(points).filter(function(i, point) {
          return point.properties.name === submission.location
        })[0];

        point.properties.visitCount ++ ;
        point.properties.duration += submission.duration
      }
    }

    return points;
  }

  function createPoint(record) {
    return {
      type: 'Feature',
      properties: {
        name: record.location,
        visitCount: 1,
        duration: record.duration
      },
      geometry: {
        type: 'Point',
        coordinates: [record.lon, record.lat]
      }
    };
  };

  function addDataToMap(data) {
    var locationsLayer = L.geoJson(data,{
      onEachFeature: addPopupContent
    }).addTo(map);
  };

  function addPopupContent(feature, layer) {
    layer.bindPopup( popUpContent(feature.properties.name, feature.properties.visitCount, feature.properties.duration))
  };

  function popUpContent(name, visitCount, duration) {
    return [
    '<p>', name, '</p><p>You\'ve been here ', visitCount,
    ' times and have spent ',duration, ' minutes birding here.</p>'
    ].join('');
  };

  function showPointCount(points) {
    $('#num-places .js-data').html(points.length);
  };
});
