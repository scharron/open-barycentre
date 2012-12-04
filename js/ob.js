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
  geocoder = new google.maps.Geocoder();

  // Init pin
  pin.infowindow = new google.maps.InfoWindow();
  pin.marker = new google.maps.Marker({
    map: map
  });

  // Init auto-complete
  autocomplete = new google.maps.places.Autocomplete($("#search_location").get(0));
  autocomplete.bindTo('bounds', map);

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    pin.infowindow.close();
    pin.marker.setVisible(false);

    var place = autocomplete.getPlace();

    if (!place.geometry) {
      // Inform the user that the place was not found and return.
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
    placeMarker(place.geometry.location);
  });

  // If submitting the form
  $("#search").submit(function(e) {
    e.preventDefault();
    pin.marker.setVisible(false);
    pin.infowindow.close();

    var address = $("#search input").val();

    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        placeMarker(results[0].geometry.location);
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
    return false;
  });

  // Set my position at the current pin positon
  function set_my_home(location) {
    var w = $("#weight").val();
    $("body").append("<script src='https://script.google.com/a/macros/data-publica.com/s/AKfycbwrsViQziFHTHE3i6zsma1C8khIl4yFVx4_fDYHqO3qyUsCZdbV/exec?latitude=" + location.lat() + "&longitude=" + location.lng() + "&weight=" + w + "'></script>");
    // Timeout to avoid the map.click to trigger.
    window.setTimeout(function() {
      pin.marker.setVisible(false);
      pin.infowindow.close();
    }, 1);
    console.log("Loading...");
  }

  function placeMarker(location) {
    pin.marker.setPosition(location);
    pin.marker.setVisible(true);
    pin.infowindow.setContent("");

    geocoder.geocode({'latLng': location}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[0]) {
          pin.infowindow.setContent(ich.place(results[0]).html());
          pin.infowindow.open(map, pin.marker);
          $(".myhome").click(function() { set_my_home(location); });
        } else {
          alert('No results found');
        }
      } else {
        alert('Geocoder failed due to: ' + status);
      }
    });
  }

  // On map click, set the marker at the click position
  google.maps.event.addListener(map, 'click', function(event) {
    placeMarker(event.latLng);
  });
  // On pin click, open the info window
  google.maps.event.addListener(pin.marker, 'click', function(event) {
    myinfowindow.open(map, pin.marker);
  });

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

    window.setInterval(get_positions, 60000);
  }

  function get_positions() {
    $("body").append("<script src='https://script.google.com/a/macros/data-publica.com/s/AKfycbwrsViQziFHTHE3i6zsma1C8khIl4yFVx4_fDYHqO3qyUsCZdbV/exec'></script>");
    console.log("Loading...");
  }

  auth = function auth() {
    $("#auth-alert").remove();
    get_positions();
  }

  function check_auth() {
    $("body").append("<script src='https://script.google.com/a/macros/data-publica.com/s/AKfycbwrsViQziFHTHE3i6zsma1C8khIl4yFVx4_fDYHqO3qyUsCZdbV/exec?myauth=1&check=1'></script>");
    console.log("Checking...");
  }

  check_auth();

});
