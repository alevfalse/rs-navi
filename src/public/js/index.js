$(document).ready(() => {
    $('form').attr('autocomplete', 'off');  // disable default autocomplete
    $("main").animate({ opacity: 1 }, 1000) // fade-in
});

let map;
let mapStyles;
let searchMarker;
let directionsService;
let directionsRenderer;
let distanceMatrixService;
let ginfoWindow;

function loapMapStyles() {
    $.getJSON("/js/mapStyles.json", function(data) {
        mapStyles = data;
        initMap();
    });
}

function initMap() {
    const options = {
        zoom: 11,
        minZoom: 10,
        center: {
            lat: 14.6091,
            lng: 121.0223
        },
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        styles: mapStyles
    }

    console.log(options.styles);

    map = new google.maps.Map(document.getElementById('map'), options);

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: 'skyblue'
        }
    });

    distanceMatrixService = new google.maps.DistanceMatrixService();

    ginfoWindow = new google.maps.InfoWindow();

    const input = document.getElementById('searchField');

    const autocomplete = new google.maps.places.Autocomplete(input, { 
        componentRestrictions: { 
            country: 'ph' 
        } 
    });

    autocomplete.addListener('place_changed', function () {

        ginfoWindow.close();
        directionsRenderer.setMap(null);
        const place = this.getPlace();

        $.ajax({
            url: '/search',
            data: { schoolName: $("#searchField").val() },
            success: function(places) {

                if (!map) return;

                for (let i=0; i<places.length; i++) {
                    addMarker(places[i]);
                }

                if (!$("#mapSection").hasClass('show')) {
                    $("#logoSection, #mapSection").collapse("toggle");
                }

                if (searchMarker) { searchMarker.setMap(null); }

                searchMarker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    icon: 'https://i.imgur.com/vTsgRCa.png'
                });

                const infoWindow = new google.maps.InfoWindow({
                    content: `<p><strong>${place.name}</strong></p>` // sanitize
                });

                infoWindow.open(map, searchMarker);

                searchMarker.addListener('click', function () {
                    map.panTo(searchMarker.position);
                    map.setZoom(18);
                    infoWindow.open(map, searchMarker);
                });

                map.panTo(place.geometry.location);
                map.setZoom(18);
            }
        });
    });
}

function addMarker(place) {

    const marker = new google.maps.Marker({
        position: { 
            lat: place.coordinates[0],
            lng: place.coordinates[1]
        },
        map: map,
        icon: 'https://i.imgur.com/0f9XMvH.png'
    });

    let placeType;
    switch (place.placeType) {
        case 0:
            placeType = "Boarding House";
            break;
        case 1:
            placeType = "Dormitory";
            break;
        case 2:
            placeType = "Apartment";
            break;
        case 3:
            placeType = "Condominium";
            break;
        default:
            placeType = "RS Navi Place";
    }

    const adr = place.address;

    let address = `${adr.number} ${adr.street}`
    if (adr.subdivision) address += `, ${adr.subdivision}`;
    address += `<br>Bgy. ${adr.barangay}, ${adr.city}<br>`;
    if (adr.zipCode) address += `${adr.zipCode} `
    address += `${adr.province}`;

    marker.addListener('click', function () {

        ginfoWindow.close();
        
        if (!marker.infoWindow) { 
            marker.infoWindow = new google.maps.InfoWindow();
        } else {
            ginfoWindow = marker.infoWindow;
            ginfoWindow.open(map, marker);
            directionsRenderer.setMap(map);
            return directionsRenderer.setDirections(marker.directionsResult);
        }

        directionsService.route({
            origin: marker.position,
            destination: searchMarker.position,
            travelMode: 'WALKING'

        }, function(result, status) {
            console.log(status);
            if (status !== 'OK') {
                return alert('Directions Service request failed.');
            }

            marker.directionsResult = result;
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(result);
        });

        distanceMatrixService.getDistanceMatrix({
            origins: [marker.position],
            destinations: [searchMarker.position],
            travelMode: 'WALKING'

        }, function(response, status) {

            console.log(status);

            if (status !== 'OK') { return alert('Failed to retrieve distance.'); }

            const rows = response.rows;

            for (let element of rows[0].elements) {
                if (element.status !== 'OK') { return alert('Failed to retrieve distance 2.'); }

                marker.infoWindow.setContent(
                    `<h5>${place.name}</strong></h5><p>${placeType}</p><p>₱ ${place.price.toLocaleString('en')}</p><p>${address}</p>` +
                    `<p>Distance: ${element.distance.text} (${element.duration.text} Walk)</p>`
                )
            }

            ginfoWindow = marker.infoWindow;
            ginfoWindow.open(map, marker);
        })
    });
}
        