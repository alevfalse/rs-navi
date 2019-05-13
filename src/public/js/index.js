let map;
let mapStyles;
let searchMarker;
let directionsService;
let directionsRenderer;
let distanceMatrixService;
let ginfoWindow;
let places;
let locality;

$(document).ready(function() {
    $('form').attr('autocomplete', 'off');  // disable default autocomplete
    $("main").animate({ opacity: 1 }, 1000) // fade-in
});

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
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        styles: mapStyles
    }

    map = new google.maps.Map(document.getElementById('map'), options);

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: 'skyblue' }
    });

    distanceMatrixService = new google.maps.DistanceMatrixService();
    ginfoWindow = new google.maps.InfoWindow();
    const input = document.getElementById('searchField');
    const autocomplete = new google.maps.places.Autocomplete(input, { 
        componentRestrictions: { country: 'ph' } 
    });

    // when a search is performed
    autocomplete.addListener('place_changed', function () {

        ginfoWindow.close();
        directionsRenderer.setMap(null);

        const place = this.getPlace();

        if (!place.geometry) { 
            return alert('Select one from the suggested places.');
        }

        for (let comp of place.address_components) {
            if (comp.types[0] === 'locality') { locality = comp.long_name }
        }

        $.ajax({
            url: '/search',
            data: { city: locality },
            success: function(results) {

                if (!map) { return; }

                addCards(results);

                // add a marker for each place given by the server
                for (let i=0; i<results.length; i++) {
                    addMarker(results[i].place);
                }

                if (!$("#results").hasClass('show')) {
                    $("#logoSection, #results").collapse("toggle");
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
        position: place.coordinates,
        map: map,
        icon: 'https://i.imgur.com/0f9XMvH.png'
    });

    let placeType;
    switch (place.placeType) {
        case 0: placeType = "Boarding House"; break;
        case 1: placeType = "Dormitory"; break;
        case 2: placeType = "Apartment"; break;
        case 3: placeType = "Condominium"; break;
        default: placeType = "RS Navi Place";
    }

    const adr = place.address;
    let address = `${adr.number} ${adr.street}`
    if (adr.subdivision) address += `, ${adr.subdivision}`;
    address += '<br>';
    if (adr.barangay) address += `Bgy. ${adr.barangay}, `;
    address += `${adr.city}<br>`;
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
            if (status !== 'OK') { return alert('Failed to retrieve distance.'); }

            const rows = response.rows;

            for (let element of rows[0].elements) {
                if (element.status !== 'OK') { return alert('Failed to retrieve distance 2.'); }

                const content = `<h5>${place.name}</strong></h5><p>${placeType}</p><p>₱ ${place.price.toLocaleString('en')}</p><p>${address}</p>` +
                `<p>Distance: ${element.distance.text} (${element.duration.text} Walk)</p>` +
                `<p><a href='/places/${place._id}' target='_blank'>Visit Page<a/>`;

                marker.infoWindow.setContent(content);
            }

            ginfoWindow = marker.infoWindow;
            ginfoWindow.open(map, marker);
        })
    });
}

$("#view-map-button").click(function() {

    if ($("#places-cards-section").hasClass('show')) {
        $(this).text('Hide Map');

        $("#places-cards-section").collapse("toggle");

        setTimeout(() => {
            $("#mapSection").css('display', 'none');
            $("#mapSection").css('opacity', '0');

            $("#mapSection").removeClass();
            $("#mapSection").addClass('col-12 text-center');
            $("#map").css('height', '700px');
            
            $("#mapSection").css('display', 'inline');
            $("#mapSection").animate({ opacity: 1}, 750);
        }, 350);
    } else {
        $(this).text('View Map');

        $("#places-cards-section").collapse("toggle");

        $("#mapSection").removeClass();
        $("#mapSection").addClass('col-12 col-md-3 text-center');
        $("#map").css('height', '300px');
    }
});

function addCards(results) {
    
    const cards = document.getElementById('places-cards');
    cards.innerHTML = '';

    if (!results || results.length === 0) {
        cards.classList.add('justify-content-center');
        cards.innerHTML = '<h3 class="my-3 text-white">Sorry, we found no available places nearby.</h3>';
        return;
    }

    cards.classList.remove('justify-content-center');

    for (let i=0; i<results.length; i++) {
        
        const column = document.createElement('div');
        column.classList = 'col-12 col-md-6 mb-2 px-1';

        const card = document.createElement('div');
        card.classList = 'card h-100';

        const carousel = document.createElement('div');
        carousel.classList = 'carousel slide';
        carousel.setAttribute('id', `carousel-${i}`);
        carousel.setAttribute('data-ride', 'carousel');

        const ol = document.createElement('ol');
        ol.classList = 'carousel-indicators';

        for (let j=0; j<results[i].place.images.length; j++) {
            const li = document.createElement('li');
            if (j === 0) { li.classList = 'active'; }
            li.setAttribute('data-target', `#carousel-${i}`)
            li.setAttribute('data-slide-to', j);
            
            ol.appendChild(li);
        }

        // carousel indicators
        carousel.appendChild(ol);

        const placeAnchor = document.createElement('a');
        placeAnchor.setAttribute('href', `/places/${results[i].place._id}`);

        const carouselInner = document.createElement('div');
        carouselInner.classList = 'carousel-inner';

        for (let k=0; k<results[i].place.images.length; k++) {
            const carouselItem = document.createElement('div');
            carouselItem.classList = 'carousel-item';
            if (k === 0) { carouselItem.classList.add('active'); }

            const cardImage = document.createElement('img');
            cardImage.setAttribute('src', results[i].place.images[k].url);
            cardImage.classList = 'card-img-top';
            cardImage.setAttribute('alt', 'Missing');

            carouselItem.appendChild(cardImage);

            carouselInner.appendChild(carouselItem);
        }

        placeAnchor.appendChild(carouselInner);

        // carousel images
        carousel.appendChild(placeAnchor);

        if (results[i].place.images.length > 1) {
            const prevAnchor = document.createElement('a');
            prevAnchor.classList = 'carousel-control-prev';
            prevAnchor.setAttribute('href', `#carousel-${i}`);
            prevAnchor.setAttribute('data-slide', `prev`);
            prevAnchor.setAttribute('role', `button`);

            const prevIcon = document.createElement('span');
            prevIcon.classList = 'carousel-control-prev-icon';

            prevAnchor.appendChild(prevIcon);

            const nextAnchor = document.createElement('a');
            nextAnchor.classList = 'carousel-control-next';
            nextAnchor.setAttribute('href', `#carousel-${i}`);
            nextAnchor.setAttribute('data-slide', `next`);
            nextAnchor.setAttribute('role', `button`);

            const nextIcon = document.createElement('span');
            nextIcon.classList = 'carousel-control-next-icon';

            nextAnchor.appendChild(nextIcon);

            carousel.appendChild(prevAnchor);
            carousel.appendChild(nextAnchor);
        }

        card.appendChild(carousel);

        const cardBody = document.createElement('div');
        cardBody.classList = 'card-body d-flex flex-column';

        const cardContainer = document.createElement('div');
        cardContainer.classList = 'container';

        const cardRow = document.createElement('div');
        cardRow.classList = 'row justify-content-between';

        const cardTitle = document.createElement('h5');
        cardTitle.classList = 'card-title text-left';
        cardTitle.innerText = results[i].place.name;

        cardRow.appendChild(cardTitle);

        if (results[i].score) {
            const col = document.createElement('div');
            col.classList = 'col-2 text-right p-0';
            col.innerHTML = `${results[i].score} <i class="fas fa-star"></i>`;

            cardRow.appendChild(col);
        }
        
        cardContainer.appendChild(cardRow);
        cardBody.appendChild(cardContainer);
        

        const price = document.createElement('h6');
        price.classList = 'card-subtitle skyblue';
        price.innerText = `₱ ${results[i].place.price.toLocaleString('en')}`;

        cardBody.appendChild(price);

        const listing = document.createElement('h6');
        listing.classList = 'card-subtitle skyblue mt-2 mb-3';

        let str = '';

        switch(results[i].place.placeType)
        {
            case 0: str += 'Boarding House'; break;
            case 1: str += 'Apartment'; break;
            case 2: str += 'Apartment'; break;
            case 3: str += 'Condominium'; break;
            default: str += 'Unknown Place Type';
        }

        switch(results[i].place.listType)
        {
            case 0: str += ' For Rent/Sale'; break;
            case 1: str += ' For Rent'; break;
            case 2: str += ' For Sale'; break;
            default: str += ' Unknown Listing';
        }

        listing.innerText = str;

        cardBody.appendChild(listing);

        // address
        const address = document.createElement('p');
        address.classList = 'card-text';

        const { number, street, subdivision, barangay, city, zipCode, province } = results[i].place.address;

        address.innerText = `${number} ${street}, ${subdivision ? `${subdivision},` : ''} ` +
        `${barangay?`Bgy. ${barangay},`:''} ` +
        `${city}, ${zipCode?`${zipCode}`:''} ${province}`;

        cardBody.appendChild(address);

        const viewDetailsSpan = document.createElement('span');
        viewDetailsSpan.classList = 'mt-auto';

        const viewDetailsLink = document.createElement('a');
        viewDetailsLink.setAttribute('href', `/places/${results[i].place._id}`);
        viewDetailsLink.setAttribute('target', `_blank`);
        viewDetailsLink.classList = 'card-link';
        viewDetailsLink.innerText = 'View Details';

        viewDetailsSpan.appendChild(viewDetailsLink);

        cardBody.appendChild(viewDetailsSpan);
        card.appendChild(cardBody);
        column.appendChild(card);
        cards.appendChild(column);
    }
}


        