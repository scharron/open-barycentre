var map;
var geocoder;

var refresh = function() {};
var auth = function() {};

var pin = {
  infowindow: null,
  marker: null
}

var homes = {
  markers: [],
  infowindow: null
};

$(function() {
  // Init google maps
  var mapOptions = {
    zoom: 13,
    center: new google.maps.LatLng(48.858859, 2.34706), // Paris
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  map = new google.maps.Map($('#map_canvas').get(0), mapOptions);
  
  // Images for other icons
  var bed = new google.maps.MarkerImage("img/bed.png",
    new google.maps.Size(32, 37),
    new google.maps.Point(0, 0),
    new google.maps.Point(16, 37)
  );
  var shadow = new google.maps.MarkerImage("img/shadow.png",
    new google.maps.Size(51, 37),
    new google.maps.Point(0, 0),
    new google.maps.Point(16, 37)
  );
  var office = new google.maps.MarkerImage("img/office-building.png",
    new google.maps.Size(32, 37),
    new google.maps.Point(0, 0),
    new google.maps.Point(16, 37)
  );
  var star = new google.maps.MarkerImage("img/star.png",
    new google.maps.Size(32, 37),
    new google.maps.Point(0, 0),
    new google.maps.Point(16, 37)
  );

  var get_positions = function() {
    $.ajax({
      url: 'https://docs.google.com/spreadsheet/pub?key=0Av-dkoq5Pj2LdDFPRVYxend0MGRNLWk0aUk3cE4yNGc&single=true&gid=2&output=csv',
      type: 'GET',
      dataType: 'text',
      success: function (data) {
        var rows = data.split("\n");
        var array = [];
        for (var j = 1; j < rows.length; ++j) {
          var row = rows[j].split(",");
          array.push([row[0], 
            parseFloat(row[1].slice(1) + "." + row[2].slice(0, -2)), 
            parseFloat(row[3].slice(1) + "." + row[4].slice(0, -2)),
            parseFloat(row[5])]);
        }
        refresh({"data": array, "me": -1});
      },
      error: function(jqXHR, textStatus, errorThrown){
        alert('An error occurred: ' + textStatus + ', ' + errorThrown);
      }
    });
  }

  refresh = function (locations) {
    if (!homes.infowindow)
      homes.infowindow = new google.maps.InfoWindow();

    // Delete old markers
    for (var i = 0; i < homes.markers.length; ++i) {
      if (homes.markers[i])
        homes.markers[i].setMap(null);
      delete homes.markers[i];
    }
    homes.markers = [];

    // center of mass coordinates
    var lat = 0;
    var lng = 0;
    var weights = 0;

    // Iterate over locations, creating markers and summing coordinates
    $(locations.data).each(function(i, element) {
      var icon = (i + 1 == locations.me) ? star : bed;
      var marker = new google.maps.Marker({
        map: map,
        shadow: shadow,
        icon: icon
      });
      marker.setPosition(new google.maps.LatLng(element[1], element[2]));
      marker.setVisible(true);

      var e = element;

      google.maps.event.addListener(marker, 'click', function(event) {
        homes.infowindow.setContent(ich.home({"user": e[0], "latitude": e[1], "longitude": e[2], "mass": e[3]}).html());
        homes.infowindow.open(map, marker);
      });
      homes.markers.push(marker);

      lat += e[1] * 10000 * e[3];
      lng += e[2] * 10000 * e[3];
      weights += e[3];
    });

    if (weights == 0)
      return;

    lat /= 10000;
    lng /= 10000;
    lat /= weights;
    lng /= weights;

    // Set the center of mass
    var marker = new google.maps.Marker({
      map: map,
      shadow: shadow,
      icon: office
    });
  
    marker.setPosition(new google.maps.LatLng(lat, lng));
    marker.setVisible(true);
    google.maps.event.addListener(marker, 'click', function(event) {
      homes.infowindow.setContent("Notre futur bureau");
      homes.infowindow.open(map, marker);
    });

    homes.markers.push(marker);

    //window.setInterval(get_positions, 60000);
  }

  get_positions();
});
