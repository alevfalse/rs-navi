function getBreadcrumbs(url) {
    let rtn = [{ name: "HOME", url: "/" }],
    acc = "", // accumulative url
    arr = url.substring(1).split("/");

    for (i=0; i<arr.length; i++) {
        if (i === arr.length-1) break;
        acc = acc+"/"+arr[i];
        rtn[i+1] = { name: arr[i].toUpperCase(), url: acc };
    }

    return rtn;
}

module.exports = function(req, res, next) {
    req.breadcrumbs = getBreadcrumbs(req.originalUrl);
    next();
}