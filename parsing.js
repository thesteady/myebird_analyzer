// parsing functions------------------------------------------------

function parseCSV(data) {
  var parsedData = Papa.parse(data, {delimiter: ",", header: true, linebreak: "\n"})
  var parsedDataRecords = _.map(parsedData.data, function(record) {
    record.lat = parseFloat(record["Latitude"])
    record.lon = parseFloat(record["Longitude"])
    record.location = record["Location"]
    record.durationMin = parseInt(record["Duration (Min)"])
    record.count = parseInt(record["Count"]) // # individuals reported
    // record["Number Of Observers"] = parseInt(record["Number Of Observers"])

    delete record["Duration (Min)"]
    delete record["Latitude"]
    delete record["Longitude"]
    delete record["Location"]
    delete record["Count"]

    if(record["Submission ID"] != "") {
      return record
    }
  });

  return {
    headers: parsedData.meta.fields,
    records: _.compact(parsedDataRecords)
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
        name: record.location,
        visitCount: 1,
        species: _.map(record.species, function(rec) {return rec.commonName }),
        duration: record.durationMin,
        countType: record["Protocol"]
      },
      geometry: {
        type: 'Point',
        coordinates: [record.lon, record.lat]
      }
    };
  };
  var sortedSubmissions = _.sortBy(submissions, function(sub) { return sub["Location"]})

  _.each(sortedSubmissions, function(submission) {
    var location = submission.location;

    if(_.includes(locationsList, location)) {
      var point = _.find(points, function(point) {
        return point.properties.name == location;
      });

      var submissionSpecies = _.map(submission.species, function(rec){
        return rec.commonName;
      });
      var uniqueSpeciesList = _.union(point.properties.species, submissionSpecies);

      point.properties.visitCount ++ ;
      point.properties.duration += submission.durationMin;
      point.properties.species = uniqueSpeciesList
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