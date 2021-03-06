let customMarker; // place marker

$('form').attr('autocomplete', 'off');  // disable default autocomplete

$(document).ready(function() {
    $("main").animate({ opacity: 1 }, 1000) // fade-in
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });

    // fade out flash messages after 15 seconds
    setTimeout(() => {
        $('.alert').animate({ 'opacity': 0 }, 1000);

        setTimeout(() => {
            $('.alert').css('display', 'none');
        }, 1000);
    }, 15000);
})

// show the pin on map button after providing name and type
$("#name, #placeType").change(function() {
    if ($("#name").val() && $("#placeType").val()) {
        $("#map-toggler").css('display', 'block');
        $("#map-toggler").animate({ 'opacity': 1 }, 500);
    }
});

$("#map-toggler").click(function() {
    $("#form").collapse("toggle");
    $("#title").animate({ 'margin-top': '0px'}, 400) // animate the Add A Place title to move to top
    $("#mapSection").animate({ opacity: 1 }, 500).css('display', 'block');
});

$("#hide-map-button").click(function() {

    $("#form").collapse("toggle");
    $("#mapSection").animate({ opacity: 0 }, 500);
    setTimeout(() => {
        $("#mapSection").css('display', 'none');
    }, 500);

    // if the additional place info fields aren't visible, push the Add A Place back down
    if (!customMarker) {
        $("#title").animate({ 'margin-top': '300px'}, 400) // animate the Add A Place title to move to top
    }
});

$("#image-gallery-toggler").click(function() {
    $("#image-gallery").animate({ opacity: 1 }, 500).css('display', 'block');
    $("#place-info").collapse("toggle");
})

$("#hide-image-button").click(function() {
    $("#place-info").collapse("toggle");
    
    $("#image-gallery").animate({ opacity: 0 }, 500);
    setTimeout(() => {
        $("#image-gallery").css('display', 'none');
    }, 500);
});

function resetImageGallery() {
    const carouselInner = document.getElementById('carousel-inner');
    while (carouselInner.firstChild) {
        carouselInner.removeChild(carouselInner.firstChild);
    }

    const carouselIndicators = document.getElementById('carousel-indicators');
    while (carouselIndicators.firstChild) {
        carouselIndicators.removeChild(carouselIndicators.firstChild);
    }
}

$("#files").change(function(event) {

    resetImageGallery();

    const files = event.target.files;

    // TODO: reset input file

    if (files.length === 0) { 
        return; 
    } else if (files.length > 10) {
        return alert('Exceeded maximum number of 10 images allowed.');
    }

    $("#hide-image-button").text('Add Images');
    $("#image-gallery-toggler").text(`${files.length} Images`);
    $("#submit-button").css('display', 'block');
    $("#indicators-section").addClass('border border-primary');
    
    for (let i=0; i<files.length; i++) {

        const reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = function(e) {

            const li = document.createElement('li');
            li.setAttribute('data-target', '#carouselExampleIndicators');
            li.setAttribute('data-slide-to', `${i}`);

             if (i === 0) { li.className = 'active'; }

            document.getElementById('carousel-indicators').insertBefore(li, null);

            const div = document.createElement('div');
            div.className = 'carousel-item';

            if (i == 0) { div.className += ' active'; }

            const image = document.createElement('img');
            image.setAttribute('src', e.target.result);
            image.className = 'card-img-top';

            div.appendChild(image);

            document.getElementById('carousel-inner').insertBefore(div, null);
        }

        // Read in the image file as a data URL.
        reader.readAsDataURL(files[i]);
    }
});

// auto select all text in the place search box when clicked
$("#searchBox").focus(function () {
    $(this).select();
});

// Google Map 
let map;
let mapStyles;

function getPinAddress(event) {
    $.ajax({
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        data: {
            latlng: `${event.latLng.lat()},${event.latLng.lng()}`,
            key: 'AIzaSyDREAoaQ27rc3JvRN_lyipAak9eT7C3tqQ'
        },
        dataType: 'json',

        success: function(res) {
            if (res.status !== 'OK') {
                return setTimeout(() => {
                    getPinAddress(event);
                }, 1500)
            }

            // clear the address fields
            $("#number").val('');
            $("#street").val('');
            $("#subdivision").val('');
            $("#barangay").val('');
            $("#city").val('');
            $("#zipCode").val('');
            $("#province").val('');

            // loop through each components of the address components
            for (let comp of res.results[0].address_components) {
                switch (comp.types[0])
                {
                    case 'street_number': 
                        $("#number").val(comp.long_name); break;

                    case 'route': 
                        $("#street").val(comp.long_name); break;

                    case 'locality': 
                        $("#city").val(comp.long_name); break;

                    case 'administrative_area_level_2': 
                        $("#province").val(comp.long_name); break;

                    case 'administrative_area_level_1':
                        if ($("#province").val().length === 0) { 
                            $("#province").val(comp.long_name); 
                        } break;

                    case 'postal_code': 
                        $("#zipCode").val(comp.long_name); break;
                }
            }

            const name   = DOMPurify.sanitize($("#name").val());
            const price  = DOMPurify.sanitize($("#price").val());
            const type   = DOMPurify.sanitize($("#placeType").val());
            const number = DOMPurify.sanitize($("#number").val());
            const street = DOMPurify.sanitize($("#street").val());
            const subdv  = DOMPurify.sanitize($("#subdivision").val());
            const brgy   = DOMPurify.sanitize($("#barangay").val());
            const city   = DOMPurify.sanitize($("#city").val());
            const zip    = DOMPurify.sanitize($("#zipCode").val());
            let   prov   = DOMPurify.sanitize($("#province").val());

            let address = '';

            if (prov.toLowerCase() === 'kalakhang maynila') $("#province").val('Metro Manila'); // translate to english

            if (number) address += number;
            if (street) address += ' ' + street + ', ';
            if (subdv)  address += subdv;
            address += '<br>';
            if (brgy)   address += 'Brgy. ' + brgy + ', ';
            if (city)   address += city;
            address += '<br>';
            if (zip) address += zip + ' ';
            if (prov) address += prov;

            const data = {
                coordinates: event.latLng,
                name: name,
                price: price,
                placeType: type,
                address: address
            }
            
            customMarker = addMarker(data);

            // if the additional place info fields are not visible, show them now after pinning
            if (!$("#place-info").hasClass('show')) {
                $("#place-info").collapse('toggle');
                $("#map-toggler").text('Pinned');
            }
        },
        error: function(err) {
            console.error(err.message);
        }
    });
}

function addMarker(data) {

    const marker = new google.maps.Marker({
        position: data.coordinates,
        map: map,
        icon: 'https://i.imgur.com/0f9XMvH.png'
    });

    switch (data.placeType) {
        case '0': data.placeType = "Boarding House"; break;
        case '1': data.placeType = "Dormitory";      break;
        case '2': data.placeType = "Apartment";      break;
        case '3': data.placeType = "Condominium";    break;
        default:  data.placeType = "RS Navi Place";
    }

    const infoWindow = new google.maps.InfoWindow({
        content: DOMPurify.sanitize(`<h5><strong>${data.name}</strong></h5><p>${data.placeType}</p>`) // sanitize
    });

    infoWindow.open(map, marker);

    marker.addListener('click', function () {
        infoWindow.open(map, marker);
    });

    return marker;
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
        backgroundColor: 'rgba(0, 0, 0, 0)',
        gestureHandling: 'greedy',
        draggableCursor: 'url(https://i.imgur.com/WLRVS45.png), auto', // cursor
        styles: mapStyles
    }

    map = new google.maps.Map(document.getElementById('map'), options);
    const input = document.getElementById('searchBox');
    const hideMapButton = document.getElementById('hide-map-button');

    map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
    map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(hideMapButton);

    // fade in controls after the map loaded
    map.addListener('tilesloaded', function() {
        $("#searchBox, #hide-map-button").animate({ 'opacity': 1 }, 1000);
    });

    map.addListener('click', function (event) {

        if (event.placeId) { return; }
        if (customMarker) { customMarker.setMap(null); } // remove previous marker
        if (map.getZoom() < 19) {
            alert("Zoom in the map or use the search box for a more accurate pin.");
            return event.stop();
        }

        $("#coordinates").val(event.latLng.lat() + ", " + event.latLng.lng());
        map.panTo(event.latLng);
        map.setZoom(21);
        getPinAddress(event);
    });

    const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'ph' }
    });

    autocomplete.addListener('place_changed', function () {
        const place = this.getPlace();
        map.panTo(place.geometry.location);
        map.setZoom(19);
    });
}

function loadMapStyles() {
    $.getJSON("/js/mapStyles2.json", function(data) {
        mapStyles = data;
        initMap();
    });
}
