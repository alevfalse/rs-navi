$("#access-logs-button").click(function() {
            
    if ($("#logs").hasClass('show')) { return $("#access-logs-data").html(''); }

    $("#access-logs-data").html('<i class="fas fa-spinner fa-spin"></i> Fetching access logs..');

    setTimeout(() => {
        $.ajax({
            url: '/access',

            success: function(accessLogs) {
                if (accessLogs && accessLogs.length > 0) {
                    let str = 'Format: <a href="https://www.npmjs.com/package/morgan#common" target="_blank">'
                        + ':remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]</a><br>'
                        + accessLogs;
                    $("#access-logs-data").html(str);
                } else {
                    $("#access-logs-data").html('No access logs to show.');
                }
            },
            error: function(res, status, err) {
                $("#access-logs-data").html(res.responseText);
            }
        });
    }, 1000);

});

$("#audit-logs-button").click(function() {
    if ($("#audit").hasClass('show')) { return $("#audit-logs-data").html(''); }
    
    $("#audit-logs-data").html('<i class="fas fa-spinner fa-spin"></i> Fetching audit logs..');

    setTimeout(() => {
        $.ajax({
            url: '/audit',

            success: function(logs) {

                $("#audit-logs-data").html('');

                if (logs && logs.length > 0) {

                    const cardBody = document.getElementById('audit-logs-data');

                    const table = document.createElement('table');
                    table.style.width = '100%';

                    const thead = document.createElement('thead');
                    const theadRow = document.createElement('tr');
                    const th1 = document.createElement('th');
                    th1.innerText = 'Date';
                    th1.classList = 'skyblue';
                    const th2 = document.createElement('th');
                    th2.innerText = 'Action';
                    th2.classList = 'skyblue';
                    const th3 = document.createElement('th');
                    th3.innerText = 'IP Address';
                    th3.classList = 'skyblue';
                    theadRow.appendChild(th1);
                    theadRow.appendChild(th2);
                    theadRow.appendChild(th3);
                    thead.appendChild(theadRow);

                    table.append(thead);

                    const tbody = document.createElement('tbody');

                    for (log of logs) {
                        const tr = document.createElement('tr');

                        const td1 = document.createElement('td');
                        td1.classList = 'shrink';
                        td1.style.paddingRight = '10px';
                        const td2 = document.createElement('td');
                        td2.classList = 'expand';
                        const td3 = document.createElement('td');
                        
                        td1.appendChild(document.createTextNode(log.date));
                        td2.innerHTML = log.text;
                        td3.innerText = log.ip;
                        
                        tr.appendChild(td1);
                        tr.appendChild(td2);
                        tr.appendChild(td3);
                        tbody.appendChild(tr);
                    }

                    table.append(tbody);
                    cardBody.append(table);
                } else {
                    $("#audit-logs-data").html('No audit logs to show.');
                }
            },
            error: function(res, status, err) {
                $("#audit-logs-data").html(res.responseText);
            }
        });
    }, 1000);
    
});


$("#reports-button").click(function() {

    if ($("#reports-data").hasClass('show')) { return; }
    
    $("#reports-data").html('<i class="fas fa-spinner fa-spin"></i> Fetching reports...');

    setTimeout(() => {
        $.ajax({
            url: '/reports',

            success: function(places) {
                if (places && places.length > 0) {
                    const cardBody = document.getElementById('reports-data');
                    cardBody.classList = 'pb-3';
                    cardBody.innerHTML = '';

                    const table = document.createElement('table');
                    table.classList = 'table table-borderless custom-table text-center';

                    const thead = document.createElement('thead');

                    const th1 = document.createElement('th');
                    th1.innerHTML = 'Place';
                    th1.classList = 'skyblue';

                    const th2 = document.createElement('th');
                    th2.innerHTML = 'Type';
                    th2.classList = 'skyblue';

                    const th3 = document.createElement('th');
                    th3.innerHTML = 'Comment';
                    th3.classList = 'skyblue';

                    const th4 = document.createElement('th');
                    th4.innerHTML = 'Author';
                    th4.classList = 'skyblue';

                    thead.appendChild(th1);
                    thead.appendChild(th2);
                    thead.appendChild(th3);
                    thead.appendChild(th4);

                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');

                    for (place of places) {
                        const tr = document.createElement('tr');

                        const td1 = document.createElement('td');
                        td1.innerHTML = `<a href="/places/${place.id}" target="_blank">${place.name}</a>`;
                        td1.style.width = '25%';

                        const td2 = document.createElement('td');
                        td2.style.width = '25%';
                        td2.innerHTML = '';

                        const td3 = document.createElement('td');
                        td3.style.width = '25%';

                        const td4 = document.createElement('td');
                        td4.style.width = '25%'; 

                        for (report of place.reports) {
                            td2.innerHTML += `${report.type}<br>`;
                            td3.innerHTML += `${report.comment}<br>`;
                            td4.innerHTML += `<a href="/profile/${report.author.id}" target="_blank">${report.author.name}<a/><br>`;
                        }

                        tr.appendChild(td1);
                        tr.appendChild(td2);
                        tr.appendChild(td3);
                        tr.appendChild(td4);

                        tbody.appendChild(tr);
                    }

                    table.appendChild(tbody);
                    cardBody.appendChild(table);
                } else {
                    $("#reports-data").html('No reports to show.');
                }
            },
            error: function(res) {
                $("#reports-data").html(res.responseText);
            }
        });
    }, 1000);
});

$("#prc-button").click(function() {
    if ($("#prc").hasClass('show')) { return $("#prc-data").html(''); }
    
    $("#prc-data").html('<i class="fas fa-spinner fa-spin"></i> Fetching pending license..')

    setTimeout(() => {
        $.ajax({
            url: '/prc',

            success: function(arr) {

                if (arr && arr.length > 0) {
                    const cardBody = document.getElementById('prc-data');
                    cardBody.innerHTML = '';

                    const table = document.createElement('table');
                    table.classList = 'table table-borderless custom-table text-center';

                    const thead = document.createElement('thead');

                    const th1 = document.createElement('th');
                    th1.innerHTML = 'Name';
                    const th2 = document.createElement('th');
                    th2.innerHTML = 'License Type';
                    const th3 = document.createElement('th');
                    th3.innerHTML = '<a class="text-center" href="https://online.prc.gov.ph/verification" target="_blank">PRC</a>';

                    thead.appendChild(th1);
                    thead.appendChild(th2);
                    thead.appendChild(th3);

                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');

                    for (a of arr) {
                        const tr = document.createElement('tr');

                        const td1 = document.createElement('td');
                        td1.innerHTML = `<a href="/profile/${a.id}" target="_blank">${a.name}</a>`
                        td1.style.width = '33%';

                        const td2 = document.createElement('td');
                        td2.innerHTML = a.license;
                        td2.style.width = '33%';

                        const td3 = document.createElement('td');
                        td3.style.width = '33%';

                        const form1 = document.createElement('form');
                        form1.setAttribute('method', 'POST');
                        form1.setAttribute('action', `/prc/${a.id}?valid=true`);
                        form1.style.display = 'inline';

                        const button1 = document.createElement('button');
                        button1.setAttribute('type', 'submit');
                        button1.classList = 'limegreen btn btn-sm custom-button';
                        button1.innerText = 'Verify';

                        form1.appendChild(button1);

                        const form2 = document.createElement('form');
                        form2.setAttribute('method', 'POST');
                        form2.setAttribute('action', `/prc/${a.id}?valid=false`);
                        form2.style.display = 'inline';

                        const button2 = document.createElement('button');
                        button2.setAttribute('type', 'submit');
                        button2.classList = 'red btn btn-sm custom-button';
                        button2.innerText = 'Reject';

                        form2.appendChild(button2);

                        td3.appendChild(form1);
                        td3.appendChild(form2);

                        tr.appendChild(td1);
                        tr.appendChild(td2);
                        tr.appendChild(td3);

                        tbody.appendChild(tr);
                    }

                    table.appendChild(tbody);
                    cardBody.appendChild(table);
                } else {
                    $("#prc-data").html('No license pending for verification.');
                }
            },
            error: function(res) {
                $("#prc-data").html(res.responseText);
            }
        });
    }, 1000);
});
