
    import {LogCache} from './modules/logcache.js'
    import {OfflineLog} from './modules/log.js';
    import {formatDateForDisplay} from './modules/helper.js';

    // Global variables
    let logCache = new LogCache();

    let log; 

    window.onload = setup;

    function setup() {

        // Attempt to sync with the database
        attemptDbSync();

        // If there's an inprogress log that hasn't been saved prompt the user about how to handle it
        if (localStorage.getItem('currentLog')) handleInProgressLog();

        // Bind all the event listeners
        addEventListeners();

    }


    function addEventListeners() {

        // welcomeScreen View
        document.getElementById('createNew').addEventListener('click', displayRecorder);

        // inProgressLog view
        document.getElementById('resumeInProgress').addEventListener('click', displayRecorder);
        document.getElementById('saveInProgress').addEventListener('click', handleSave);
        document.getElementById('deleteInProgress').addEventListener('click', handleDiscard);

        // logRecorder view
        document.getElementById('saveLog').addEventListener('click', handleSave);
        document.getElementById('undo').addEventListener('click', handleUndo);
        document.getElementById('redo').addEventListener('click', handleRedo);
        let addButtons = document.getElementsByClassName('addBird');
        for (let button of addButtons) {
            button.addEventListener('click', addBird)
        }

        // saveFields view
        document.getElementById('save').addEventListener('click', (e) => {
            e.preventDefault();
            log.weather = e.target.form.weather.value;
            log.notes = e.target.form.notes.value;
            saveLog();
        });
        document.getElementById('discard').addEventListener('click', handleDiscard);

    }


    function handleDiscard() {
        let remove = window.confirm("Are you sure you want to discard this log? This cannot be undone.")
        if (remove) {
            localStorage.removeItem('currentLog')
            log = undefined;
            showView('welcomeScreen');
        };
    }



    function handleInProgressLog() {

        showView('inProgressLog');

        // Create a new log from the localstorage data and save it to the global log variable;
        let logData = JSON.parse(localStorage.getItem('currentLog'))
        log = OfflineLog.fromData(logData);

        document.getElementById('inProgressLogDate').innerHTML = formatDateForDisplay(log.startTime);
        document.getElementById('inProgressLogCount').innerHTML = log.currentCount + (log.currentCount == 1 ? " bird" : " birds");

    }


    function displayRecorder() {

        log = log ? log : new OfflineLog('realTime', new Date());

        showView('logRecorder');
        updateUndoRedoState();

        document.getElementById('currentTotal').innerHTML = log.currentCount;

    }

    function handleUndo() {
        log.undo();

        // Update undo / redo buttons
        updateUndoRedoState();

        // Display the new total
        document.getElementById('currentTotal').innerHTML = log.currentCount;
    }

    function handleRedo() {
        log.redo();

        // Update undo / redo buttons
        updateUndoRedoState();

        // Display the new total
        document.getElementById('currentTotal').innerHTML = log.currentCount;
    }

    function handleSave(e) {
        if (log.data.length > 0) {
            
            // Zero out the weather and notes fileds
            let weather = document.getElementById('weather').value = "";
            let notes = document.getElementById('notes').value = "";

            // Show the save fields view
            showView('saveFields');
        }
        else {
            showView("welcomeScreen");
        }
    }

    function getStatusMessage() {
        let message = "";
        let logCount = logCache.logs.length; 
    
        message = navigator.onLine ? "Online: " : "Offline: ";
        if (logCount == 0) message += "All logs synced";
        else message += `${logCount} ${logCount == 1 ? "log" : "logs"} waiting to be synced`;
    
        return message;
    }

    function addBird(e) {
        // Add the birds to the log
        let num = Number(e.target.value);
        log.addData(num);

        // Update the undo / redo buttons
        updateUndoRedoState()

        // Display the new total
        document.getElementById('currentTotal').innerHTML = log.currentCount;
    }

    function saveLog() {
        // Add the log to the log cache and remove the temporary currentLog storage

        if (log.data.length > 0) {
            // Save the log to the log cache
            logCache.addLog(log);
            localStorage.removeItem('currentLog');
            log = undefined;
        }

        // Display the home view
        showView("welcomeScreen")

        // Attempt to sync with the database
        attemptDbSync();

    }

    function attemptDbSync() {
        let statusOut = document.getElementById('status')

        if (navigator.onLine && logCache.hasLogs()) {
            statusOut.innerHTML = "Syncing Logs...";
            
            console.log(logCache);
            
            logCache.addToDb()
                .then(() => {
                    statusOut.innerHTML = "Online: All logs synced";
                })
                .catch((e) => {
                    console.log(e);
                    statusOut.innerHTML = "Error syncing logs. All data is still saved locally and will be resynced the next time you launch the app.";
                })
        }

        else statusOut.innerHTML = getStatusMessage();
    }


    function showView(id) {
        let views = document.getElementsByClassName('view');
        for (let view of views) {
            if (view.id == id) view.classList.remove('hide');
            else view.classList.add('hide');
        }
    }

    function updateUndoRedoState() {
        let undo = document.getElementById('undo');
        let redo = document.getElementById('redo');

        undo.disabled = log.data.length > 0 ? false : true;
        redo.disabled = log.redoCache.length > 0 ? false : true;
    }