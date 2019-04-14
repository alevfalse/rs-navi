$('form').attr('autocomplete', 'off');  // disable default autocomplete

$(document).ready(function() {
    $("main").animate({ opacity: 1 }, 1000) // fade-in
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });
})

$("#mapToggler").click(function() {
    $("#mapSection").animate({ opacity: 1 }, 500).css('display', 'block');
    $("#form").collapse("toggle");
});

$("#hide-map-button").click(function() {
    $("#form").collapse("toggle");
    
    $("#mapSection").animate({ opacity: 0 }, 500);
    setTimeout(() => {
        $("#mapSection").css('display', 'none');
    }, 500);
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

// show additional place inputs after providing name and type
$("#name, #placeType").change(function() {
    if ($("#place-info").hasClass('show')) { return }
    if ($("#name").val() && $("#placeType").val()) {
        $("#place-info").collapse("toggle");
        $("#title").animate({ 'margin-top': '50px'}, 450)
    }
})

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

    $("#submit-button").css('display', 'block');
    
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
})

// preview image filenames
function previewImages() {
    console.log($("#file").get(0).files)
    const files = Array.from($("#file").get(0).files);
    const text = files.reduce((str, file, index) => {
        return str + file.name + (index != files.length-1 ? ', ' : '');
    }, '');
    $("#labelForFile").text(text).css('height', `auto`);
}

let mapStyles;

function loadMapStyles() {
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
        backgroundColor: 'rgba(0, 0, 0, 0)',
        gestureHandling: 'greedy',
        draggableCursor: 'url(https://i.imgur.com/WLRVS45.png), auto', // cursor
        styles: mapStyles
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


    function addMarker(data) {

        const marker = new google.maps.Marker({
            position: data.coordinates,
            map: map,
            icon: 'https://i.imgur.com/0f9XMvH.png'
        });

        switch (data.placeType) {
            case "0": data.placeType = "Boarding House"; break;
            case "1": data.placeType = "Dormitory"; break;
            case "2": data.placeType = "Apartment"; break;
            case "3": data.placeType = "Condominium"; break;
            default: data.placeType = "RS Navi Place";
        }

        const infoWindow = new google.maps.InfoWindow({
            content: `<h5><strong>${data.name}</strong></h5><p>${data.placeType}</p>` // sanitize
        });

        infoWindow.open(map, marker);
        marker.addListener('click', function () {
            infoWindow.open(map, marker);
        });

        return marker;
    }

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

                $("#number").val('');
                $("#street").val('')
                $("#subdivision").val('');
                $("#barangay").val('');
                $("#city").val('');
                $("#zipCode").val('');
                $("#province").val('');

                for (let comp of res.results[0].address_components) {
                    switch (comp.types[0])
                    {
                        case 'street_number': $("#number").val(comp.long_name); break;
                        case 'route': $("#street").val(comp.long_name); break;
                        case 'locality': $("#city").val(comp.long_name); break;
                        case 'administrative_area_level_2': $("#province").val(comp.long_name); break;
                        case 'administrative_area_level_1': {
                            if ($("#province").val().length == 0) { $("#province").val(comp.long_name);}
                        } break;
                        case 'postal_code': $("#zipCode").val(comp.long_name); break;
                    }
                }

                const number = $("#number").val();
                const street = $("#street").val()
                const subdv  = $("#subdivision").val();
                const brgy   = $("#barangay").val();
                const city   = $("#city").val();
                const zip    = $("#zipCode").val();
                const prov   = $("#province").val();

                let address = '';

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
                    name: $("#name").val(),
                    price: $("#price").val() || 0,
                    placeType: $("#placeType").val(),
                    address: address
                }
                
                customMarker = addMarker(data);
            },
            error: function(err) {
                console.error(err.message);
            }
        });
    }
}