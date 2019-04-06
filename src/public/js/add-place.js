$('form').attr('autocomplete', 'off');  // disable default autocomplete
$(document).ready(function() {
    $("main").animate({ opacity: 1 }, 1000) // fade-in
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })
})

$("#mapToggler").click(function () {
    if ($("#mapSection").hasClass('show')) {
        $(this).text('Pin Onto The Map');
    } else {
        $(this).text('Hide Map');
    }
    
    $("#mapSection").collapse("toggle");
    $("#form").collapse("toggle");
});

$("#searchBox").focus(function () {
    $(this).select();
})

function initMap() {
    const options = {
        zoom: 11,
        minZoom: 10,
        center: {
            lat: 14.6091,
            lng: 121.0223
        },
        disableDefaultUI: true,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        draggableCursor: 'url(https://i.imgur.com/WLRVS45.png), auto', // cursor
        styles: [{
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#1d2c4d"
                }]
            },
            {
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#808080"
                }]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#8ec3b9"
                }]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1a3646"
                }]
            },
            {
                "featureType": "administrative.country",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#4b6878"
                }]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#64779e"
                }]
            },
            {
                "featureType": "administrative.province",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#4b6878"
                }]
            },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#023e58"
                }]
            },
            {
                featureType: "poi",
                stylers: [{    
                    visibility: "off"
                }]   
            },
            {
                featureType: "poi.school",
                stylers: [{    
                    visibility: "on"
                }]   
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#283d6a"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#6f9ba5"
                }]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1d2c4d"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#023e58"
                }]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#3C7680"
                }]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#304a7d"
                }]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#98a5be"
                }]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1d2c4d"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#2c6675"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{
                    "color": "#255763"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#b0d5ce"
                }]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#023e58"
                }]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#98a5be"
                }]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.stroke",
                "stylers": [{
                    "color": "#1d2c4d"
                }]
            },
            {
                "featureType": "transit.line",
                "elementType": "geometry.fill",
                "stylers": [{
                    "color": "#283d6a"
                }]
            },
            {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#3a4762"
                }]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{
                    "color": "#0e1626"
                }]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [{
                    "color": "#4e6d70"
                }]
            }
        ]
    }

    const map = new google.maps.Map(document.getElementById('map'), options);

    const input = document.getElementById('searchBox');
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);

    map.addListener('tilesloaded', function () {
        input.style.display = 'inline';
        $("#searchBox").animate({
            opacity: 1
        }, 1000);
    });

    let customMarker;

    map.addListener('click', function (event) {

        if (event.placeId) {
            return;
        }

        if (customMarker) {
            customMarker.setMap(null);
        }

        const address = $("#number").val() + " " + $("#street").val() + ", " + $("#subdivision").val()
            + "<br>Brgy. " + $("#barangay").val() + ", " + $("#city").val()
            + "<br>" + $("#zipCode").val() + " " + $("#province").val();

        const data = {
            coordinates: event.latLng,
            name: $("#name").val(),
            price: $("#price").val(),
            placeType: $("#placeType").val(),
            address: address
        }

        if (map.getZoom() < 19) {
            alert("Zoom in the map or use the search box for a more accurate pin.");
            event.stop();
            return null;
        }

        $("#coordinates").val(event.latLng.lat() + ", " + event.latLng.lng());
        
        map.panTo(data.coordinates);
        map.setZoom(21);
        customMarker = addMarker(data);
    });

    const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: {
            country: 'ph'
        }
    });

    autocomplete.addListener('place_changed', function () {
        const place = this.getPlace();
        console.log(place);

        map.panTo(place.geometry.location);
        map.setZoom(19);
    });

    function addMarker(data) {

        const marker = new google.maps.Marker({
            position: data.coordinates,
            map: map,
            icon: 'https://i.imgur.com/0f9XMvH.png'
        });

        switch (data.placeType) {
            case "0":
                data.placeType = "Boarding House";
                break;
            case "1":
                data.placeType = "Dormitory";
                break;
            case "2":
                data.placeType = "Apartment";
                break;
            case "3":
                data.placeType = "Condiminium";
                break;
            default:
                data.placeType = null;
        }

        const infoWindow = new google.maps.InfoWindow({
            content: `<h4><strong>${data.name}</strong></h4><p>₱${data.price} - ${data.placeType}</p><p>${data.address}</p>` // sanitize
        });

        infoWindow.open(map, marker);
        marker.addListener('click', function () {
            infoWindow.open(map, marker);
        });
        return marker;
    }
}