$("#access-logs-button").click(function() {
            
    if ($("#logs").hasClass('show')) { return $("#access-logs-data").html(''); }

    $("#access-logs-data").html('<i class="fas fa-spinner fa-spin"></i> Fetching access logs...');

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
            }
        });
    }, 1250);

});

$("#audit-logs-button").click(function() {
    if ($("#audit").hasClass('show')) { return $("#audit-logs-data").html(''); }
    
    $("#audit-logs-data").html('<i class="fas fa-spinner fa-spin"></i> Fetching audit logs...');

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
                    const th2 = document.createElement('th');
                    th2.innerText = 'Action';
                    const th3 = document.createElement('th');
                    th3.innerText = 'IP Address';
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
    }, 1250);
    
});


$("#reports-button").click(function() {
    if ($("#reports-data").hasClass('show')) { return; }
    
    $("#reports-data").html('<i class="fas fa-spinner fa-spin"></i> Fetching reports...');

    /*
    setTimeout(() => {
        $.ajax({
            url: '/reports',

            success: function(reports) {
                // ...
            }
        });
    }, 2000);
    */
});
