  import {Log} from '../modules/log.js';
    import {buildRow, formatPlaybackTime} from '../modules/helper.js';
    import {EditableField} from '../modules/editablefield.js';

    window.onload = setup;
    google.charts.load('current', {'packages':['corechart']});

    var id;

    function setup() {

        const params = new URLSearchParams(location.search);
        id = params.get('id');

        if (id) {
            loadLog(id);
        }
    
    }



async function loadLog(id) {
    // Load the log
    let log = await Log.fromId2(id);

    const date = `${log.startTime.getMonth()}/${log.startTime.getDate()}/${log.startTime.getFullYear()}`;
    
    // Update the page Titles
    document.title = `Swift Log ${date}`;
    document.getElementById('date').innerHTML = date;

    // Add the count
    document.getElementById('count').innerHTML = log.currentCount;

    // Setup notes and weather fields
    let notesField = new EditableField(
        id,
        'notes',
        document.getElementById('notes'),
        document.getElementById('editNotes'),
        log.notes,
        "No notes entered"
    )

    let weatherField = new EditableField(
        id,
        'weather',
        document.getElementById('weather'),
        document.getElementById('editWeather'),
        log.weather,
        "No weather information entered"
    )

    // document.getElementById('notes').innerHTML = log.notes ? log.notes : "No notes entered";
    // document.getElementById('weather').innerHTML = log.weather ? log.weather: "No weather information entered";

    // Update the edit log link
    let editLogLink = document.getElementById('editLog');
    if (log.logType == 'video') editLogLink.href = `videolog.html?id=${id}`;
    else {
        let parent = editLogLink.parentElement;
        parent.parentElement.removeChild(parent);
    }

    // Download link
    let downloadLogLink = document.getElementById('downloadLog');
    downloadLogLink.href = `api/logtospreadsheet.php?id=${id}`;

    // Output the raw data
    let rawDataTable = document.getElementById('rawLog');
    log.data.forEach(entry => {
        rawDataTable.appendChild(buildRow([formatPlaybackTime(new Date(log.startTime.getTime() + entry.time)), entry.count]))
    })


    // Get the count by minute
    // let minuteCount = log.getCountByInterval(10);
    let minuteCount = log.getTotalByInterval(60);

    let chartData = minuteCount.map(entry => {
        return [entry.time, entry.count, entry.runningTotal];
    })

    drawChart(chartData)

    // Output the minute count
    const tbody = document.getElementById('log');

    minuteCount.forEach(minute => {
        tbody.appendChild(buildRow([formatPlaybackTime(minute.time), minute.count, minute.runningTotal]))
    })
    
}


function drawChart(tempData) {

    var data = new google.visualization.DataTable();
    data.addColumn('date', 'Time');
    data.addColumn('number', 'Count');
    data.addColumn('number', 'Running Total');

    data.addRows(tempData);

    var options = {
        title: 'Recorded Data',
        seriesType: 'bars',
        series: {
            0: {type: 'bar',
                targetAxisIndex: 0},
            1: {type: 'line',
                targetAxisIndex: 1}
        },
        vAxes: {
            0: {title: 'count'},
            1: {title: 'total'}
        }
    };

    var chart = new google.visualization.ComboChart(document.getElementById('dataChart'));

    chart.draw(data, options);
}

function downloadLog() {

    

}