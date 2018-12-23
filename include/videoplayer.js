
import {VideoPlayer} from '../modules/videoplayer3.js';
import {Log} from '../modules/log.js';

var video, startTime, log, slider, graph, countOut, dragCount = 0, videoFile, id, fromDB = false, videoPlayer; 

window.log = log;

window.onload = setup;

function setup() {
    
    const params = new URLSearchParams(location.search);
    id = params.get('id');

    if (id) {
        fromDB = true; 
        buildPlayerFromId(id);
    }

    const dropBox = document.getElementById('dropbox');
    const fileUpload = document.getElementById('fileUpload');
    fileUpload.addEventListener("change", handleUpload)

    dropbox.addEventListener("dragenter", dragEnter, false);
    dropbox.addEventListener("dragover", dragOver, false);
    dropbox.addEventListener("dragleave", dragLeave, false);
    dropbox.addEventListener("drop", drop, false);
    dropbox.addEventListener('click', () => {fileUpload.click()})
}


async function buildPlayerFromId(id) {
    log = await Log.fromId2(id);
    document.getElementById('clickToUpload').innerHTML = `Click to Upload ${log.fileName}`;
}


function dragEnter(e) {
    e.stopPropagation();
    e.preventDefault();

    dragCount++; 

    e.target.classList.add('active');
}

function dragOver(e) {
    e.stopPropagation();
    e.preventDefault();
}

function dragLeave(e) {
    e.stopPropagation();
    e.preventDefault();

    dragCount--; 

    if (dragCount === 0) {
        e.target.classList.remove('active');
    }
}

function drop(e) {
    e.stopPropagation();
    e.preventDefault();

    // Grab the file
    const file = e.dataTransfer.files[0];

    if (fromDB) {
        // Check to makes sure the uploaded file name matches the file name in the log
        if (file.name == log.fileName) {
            videoFile = file;
            handleVideoUpload();
        }
    }
    else {        
        // Check to make sure the file type contains "video"
        if (/video/.test(file.type.toLowerCase())) {
            videoFile = file; 
            handleVideoUpload();
        }
    }

}

function handleUpload(e) {

    const file = this.files[0];

    if (fromDB) {
        // Check to makes sure the uploaded file name matches the file name in the log
        if (file.name == log.fileName) {
            videoFile = file;
            handleVideoUpload();
        }
    }
    else {
        // Check to make sure the file type contains "video"
        if (/video/.test(file.type.toLowerCase())) {
            videoFile = file; 
            handleVideoUpload();
        }
    }


}


function handleVideoUpload() {
    // Hide the upload screen
    document.getElementById('videoUpload').classList.add('hide');        

    // Create the videoplayer object
    videoPlayer = new VideoPlayer(document.getElementById('videoPlayer'));
    
    // Load the video
    let videoURL = URL.createObjectURL(videoFile);
    videoPlayer.loadVideo(videoURL)

    if (fromDB) {
        startTime = log.startTime;
        displayVideoPlayer();
    }
    else {
        // Get the video's last modified date
        startTime = new Date(videoFile.lastModified);

        // Populate the date form
        document.getElementById('month').value = startTime.getMonth() + 1;
        document.getElementById('day').value = startTime.getDate();
        document.getElementById('year').value = startTime.getFullYear();

        // Display the date form
        document.getElementById('assignDate').classList.remove('hide');

        // Add submit listener to the form
        document.getElementById('logDate').addEventListener('submit', (e) => {
            e.preventDefault();

            let m = Number(e.target.month.value);
            let d = Number(e.target.day.value);
            let y = Number(e.target.year.value);

            // Do some rudimentary validation on the date
            if (m > 0 && m <= 12 && d > 0 && d <= 31 && y > 0) {
                // Update starTime with the values from the form
                startTime.setYear(y);
                startTime.setMonth(m - 1);
                startTime.setDate(d);

                // Display the video player
                displayVideoPlayer(e.target.notes.value, e.target.weather.value)
            }

        })
    }
}


function displayVideoPlayer(notes,weather) {

    // Hide the date form
    document.getElementById('assignDate').classList.add('hide');
    
    // Create the log
    if (!fromDB) log = new Log('video', startTime,videoFile.name,undefined,weather,notes);

    // Show the video
    videoPlayer.displayPlayer(log)
    document.getElementById('videoPlayer').classList.remove('hide');

}