export function leftPad(string,len,char = ' ') {

    string = String(string);
    char = String(char);

    const padLength = len - string.length; 

    if (len <= 0)
        return string; 

    return char.repeat(padLength) + string;

}

export function formatTimeForDisplay(time) {
    return `${leftPad(time.getHours(),2,0)}:${leftPad(time.getMinutes(),2,0)}:${leftPad(time.getSeconds(),2,0)}`;
}

/**
 * 
 * @param {string} url 
 * @param {string} method 
 * @param {string} body 
 * @param {string} contentType 
 */
export function makeHttpRequest(url,method,body,contentType = 'application/x-www-form-urlencoded') {

    return new Promise((resolve, reject) => {

        var req = new XMLHttpRequest();
        req.open(method, url);

        req.setRequestHeader('Content-type', contentType);

        req.onload = function() {
            if (req.status == 200)
                resolve(req.response)
            else
                reject(Error(req.statusText));
        }

        // Handle network errors
        req.onerror = function() {
            reject(Error("Network Error"));
        };

        // Make the request
        req.send(body);

    })
}


export function buildRow(cols, cellType = 'td') {

    let tr = document.createElement('tr');

    cols.forEach(value => {
        let cell = document.createElement(cellType);

        if (typeof value == 'object') cell.appendChild(value);
        else cell.innerHTML = value;

        tr.appendChild(cell);
    })

    return tr;
}

export function formatPlaybackTime(time) {
    return `${leftPad(time.getHours(),2,0)}:${leftPad(time.getMinutes(),2,0)}:${leftPad(time.getSeconds(),2,0)}`;
}