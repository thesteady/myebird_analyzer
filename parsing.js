// parsing functions------------------------------------------------

function parseCSV(data) {
  var parsedData = Papa.parse(data, {delimiter: ",", header: true, linebreak: "\n"})
  var parsedDataRecords = _.map(parsedData.data, function(record) {
    record["lat"] = parseFloat(record["Latitude"])
    record["lon"] = parseFloat(record["Longitude"])
    record["Duration (Min)"] = parseInt(record["Duration (Min)"])
    record["Count"] = parseInt(record["Count"]) // # individuals reported
    // record["Number Of Observers"] = parseInt(record["Number Of Observers"])

    return record
  });
  console.log("parsedRecord", parsedDataRecords[0])

  return {
    headers: parsedData.meta.fields,
    records: parsedDataRecords
  };
}

// conversions------------------------------------------------

function convertToGeoJSON(submissions) {
  var locationsList = [];
  var points = [];
  var createPoint = function(record) {
    return {
      type: 'Feature',
      properties: {
        name: record["Location"],
        visitCount: 1,
        speciesCount: record["species"].length,
        duration: record["Duration (Min)"],
        countType: record["Protocol"]
      },
      geometry: {
        type: 'Point',
        coordinates: [record.lon, record.lat]
      }
    };
  };

  _.each(submissions, function(submission) {
    var location = submission["Location"];
    if(_.includes(locationsList, location)) {
      var point = _.find(points, function(point) {
        return point.properties.name == location;
      });
      point.properties.visitCount ++ ;
      point.properties.duration += submission["Duration (Min)"];
    } else {
      // new point!
      locationsList.push(location);
      points.push(createPoint(submission));
    }
  });

  return {
    type: "FeatureCollection",
    features: points
  };
}

function convertMinutesToPrettyFormatTime(minutes) {
  var hours = minutes / 60;
  var days = hours / 24;

  if(hours < 1) {
    return [minutes, ' minutes'].join('');
  } else if (days < 1) {
    return [hours.toFixed(2), ' hours'].join(''); //convert to minutes, hours
  }else {
    return [days.toFixed(2), ' days'].join('');
  }
}