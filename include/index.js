import {makeHttpRequest} from '../modules/helper.js';

    const params = new URLSearchParams(location.search);
    var year = params.get('year') ? params.get('year') : new Date().getFullYear();

    window.onpopstate = handleNewState;

    window.onload = setup;

    async function setup() {

        // Set up the year selector dropdown
        await initializeYearDropdown(year);

        // Populate the table
        await populateTable(year);

    }

    async function initializeYearDropdown(selectedYear) {

        var years = await makeHttpRequest('api/years', 'GET')
        years = JSON.parse(years).map(year => Number(year));
        
        let currentYear = new Date().getFullYear()

        // If the current year isn't in the list of years add it
        if (years.indexOf(currentYear) < 0) years.unshift(currentYear);

        // Populate the year dropdown
        let yearSelect = document.getElementById('years');
        years.forEach(year => {
            let option = document.createElement('option');
            option.value = year; 
            option.innerHTML = year;
            if (year == selectedYear) option.selected = true;
            yearSelect.appendChild(option);
        });

        // Add an event listener to the dropdown
        yearSelect.addEventListener('change', async (e) => {
            await populateTable(e.target.value)
            history.replaceState({reload: false}, "", window.location.href);
            history.pushState({}, "", `?year=${e.target.value}`);
        }) 
    }

    async function handleNewState(e) {

        console.log("state", e.state)

        // var state = e.originalEvent.state;

        // console.log(new Date())

        // if (e.state) {
        //     console.log("THERE WAS AN EVENT");
        //     console.log(e.state);
        // }


        const params = new URLSearchParams(location.search);
        year = params.get('year') ? params.get('year') : new Date().getFullYear();

        document.getElementById('years').value = year;
        populateTable(year);
    }

    async function populateTable(year) {

        let tbody = document.getElementById('logs');
        tbody.innerHTML = "";

        var logs = await makeHttpRequest('api/logs?year='+year,'GET');
        logs = JSON.parse(logs);

        logs.forEach(log => {
            let date = new Date(log.date);

            let dateLink = document.createElement('a');
            dateLink.href = `log.html?id=${log.id}`;
            dateLink.innerHTML = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            
            let totalCount = log.totalCount ? log.totalCount : 0;

            let logDisplayNames = {
                realTime: "Real Time",
                video: "Video"
            } 
            let logName = logDisplayNames[log.log_type] ? logDisplayNames[log.log_type] : "Other";

            tbody.appendChild(buildRow([dateLink, logName, totalCount, log.weather, log.notes]))
        })

        return true;
    }


    function buildRow(cols, cellType = 'td') {

        let tr = document.createElement('tr');

        cols.forEach(value => {
            let cell = document.createElement(cellType);

            if (typeof value == 'object') cell.appendChild(value);
            else cell.innerHTML = value;

            tr.appendChild(cell);
        })

        return tr;
    }