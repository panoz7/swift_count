import {leftPad, formatTimeForDisplay} from './helper.js';

export class TimeSlider {
    
    constructor(video,div,startTime,duration) {
        this.video = video; 
        this.div = div;

        // Time variables
        this.startTime = startTime;
        this.duration = duration;
        this.currentTime = startTime; 

        // Drag variables
        this.dragListener;
        this.dragStartPosMouse = 0;
        this.dragStartPosKmob = 0;  

        this.paused = true;
        this.onEvents = {}; 

        this.initialize();
    }

    initialize() {
        // get the slider knob and duration bar
        this.sliderKnob = this.div.getElementsByClassName('sliderKnob')[0];
        this.sliderBack = this.div.getElementsByClassName('sliderBack')[0];
        this.durationBar = this.div.getElementsByClassName('durationBar')[0];
        this.playbackTime = this.div.getElementsByClassName('time')[0];
        this.playbackSpeedSelect = document.getElementById('playbackSpeed');
        this.skipAhead = document.getElementById('skipAhead');
        this.skipBack = document.getElementById('skipBack');
        this.playBut = document.getElementById('play');

        // Set the playback time to the startTime
        this.playbackTime.innerHTML = formatTimeForDisplay(this.startTime);

        // Get the current playback speed and skip distance
        const selectedPlaybackSpeed = this.playbackSpeedSelect.options[this.playbackSpeedSelect.selectedIndex];
        this.playbackSpeed = selectedPlaybackSpeed.value;
        this.skipDistance = Number(selectedPlaybackSpeed.dataset.skipdistance);

        // Add event listeners
        this.sliderKnob.addEventListener('mousedown',this.handleMouseDown.bind(this));
        this.sliderBack.addEventListener('mousedown', this.handleSeek.bind(this));
        this.playbackSpeedSelect.addEventListener('change', this.handlePlayBackSpeedChange.bind(this));
        this.skipAhead.addEventListener('click',this.handleSkip.bind(this));
        this.skipBack.addEventListener('click',this.handleSkip.bind(this));
        this.playBut.addEventListener('click', this.handlePlayPause.bind(this));
        this.video.addEventListener('click',this.handlePlayPause.bind(this));
        this.playbackTime.addEventListener('click',this.handleTimeUpdate.bind(this));

        // Keyboard Events
        addEventListener('keyup', this.handleKeyPress.bind(this))
    }

    handleSeek(e) {
        if (e.target != this.sliderKnob) {
            // This is where the user clicked on the playback bar
            const clickPos = e.offsetX; 

            // Move the slider knob and the duration bar to the point where the user clicked
            this.sliderKnob.style.left = clickPos + 'px';
            this.durationBar.style.width = clickPos + 'px';

            // Update the time display with the current time
            const time = this.getTimeFromKnob();
            this.currentTime = time; 
            this.updateTimeDisplay(time)
            this.updateVideo(time,true)

            // Track if the user starts dragging the knob after clicking
            this.handleMouseDown(e);
        }
    }

    handleMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();

        // Pause the video
        this.video.pause();

        // Get the position of the mouse and the knob when the user clicks down
        this.dragStartPosMouse = e.clientX; 
        this.dragStartPosKnob = this.sliderKnob.offsetLeft;

        // Bind the handle mouse up and drag functions to this (we do this here instead of in addeventlistener so we can remove them later)
        this.handleMouseUpBound = this.handleMouseUp.bind(this);
        this.handleDragBound = this.handleDrag.bind(this);
        
        // Add the event listeners
        document.addEventListener('mousemove',this.handleDragBound);
        document.addEventListener('mouseup',this.handleMouseUpBound);
    }

    handleMouseUp(e) {
        if (!this.paused) this.video.play();

        // If the user lets go of hte mouse remove the mouse up and mouse move event listeners
        document.removeEventListener('mouseup',this.handleMouseUpBound)
        document.removeEventListener('mousemove',this.handleDragBound)
    }

    handleDrag(e) {
        e.preventDefault();
        e.stopPropagation();

        // Determine how far the user has moved the mouse from the original position
        const delta = e.clientX - this.dragStartPosMouse;

        // Calculate where the knob should be positioned
        const newPos = this.dragStartPosKnob + delta + this.sliderKnob.offsetWidth / 2;

        // If the calcualted position isn't beyond the edges of the slider back move the knob and duration bar to the new position
        if (newPos >= 0 && newPos <= this.sliderBack.offsetWidth) {
            this.sliderKnob.style.left = newPos + 'px'; 
            this.durationBar.style.width = newPos + 'px';
        }

        // Update the time display with the new time
        const time = this.getTimeFromKnob();
        this.currentTime = time; 
        this.updateTimeDisplay(time)
        this.updateVideo(time)

        return true;
    }

    handlePlayBackSpeedChange() {
        this.playbackSpeed = this.playbackSpeedSelect.value; 
        this.skipDistance = Number(this.playbackSpeedSelect.options[this.playbackSpeedSelect.selectedIndex].dataset.skipdistance);
        
        this.skipAhead.innerHTML = "+" + this.skipDistance;
        this.skipBack.innerHTML = "-" + this.skipDistance;

        this.video.playbackRate = this.playbackSpeed;
    }

    handleSkip(e) {
        const skipDistance = e.target.id == "skipAhead" ? this.skipDistance : this.skipDistance * -1;
        this.setTime(new Date(this.currentTime.getTime() + skipDistance * 1000),true); 
    }

    handlePlayPause() {
        console.log("handle play pause");

        if (this.video.paused) {
            this.paused = false; 
            this.playBut.classList.remove("paused");
            this.video.play();
        }
        else {
            this.paused = true; 
            this.playBut.classList.add("paused");
            this.video.pause();
        }
    }

    handleKeyPress(e) {
        // Space bar
        if (e.keyCode == 32) {
            this.handlePlayPause();
        }
        // left arrow (37) or right arrow (39)
        else if (e.keyCode == 39 || e.keyCode == 37) {
            const direction = e.keyCode == 39 ? 1 : -1; 
            this.setTime(new Date(this.currentTime.getTime() + direction * this.skipDistance * 1000),true); 
        }
        else if (e.keyCode == 188 || e.keyCode == 190) {
            // Pause the video
            this.paused = true;
            this.video.pause();

            // Advance frame by frame
            const direction = e.keyCode == 190 ? 1 : -1; 
            const newTime = new Date(this.currentTime.getTime() + (direction / 60 * 1000));
            this.setTime(newTime,true)

        }
        else if (e.keyCode == 187 || e.keyCode == 189) {
                const increment = e.keyCode == 187 ? -1 : 1; 
                const currentIndex = this.playbackSpeedSelect.selectedIndex;
                const newIndex = currentIndex + increment; 
    
                if (newIndex >= 0 && newIndex < this.playbackSpeedSelect.length) {
                    this.playbackSpeedSelect.value = this.playbackSpeedSelect[newIndex].value;
                    this.handlePlayBackSpeedChange();
                }
        }
        else {
            // console.log(e.keyCode);
        }
    }

    handleTimeUpdate(e) {

        const newTime = prompt("Enter time in format xx:xx:xx");

        let match = /(\d{1,2}):(\d{2}):(\d{2})/.exec(newTime);
        if (match) {

            let [_,h,m,s] = match;
            
            // Create a new date with the same date but time set to the new time
            let newTime = new Date(this.currentTime.getTime());
            newTime.setHours(Number(h));
            newTime.setMinutes(Number(m));
            newTime.setSeconds(Number(s));

            // Calculate the difference in ms between the new time and the current time
            let delta = newTime.getTime() - this.currentTime.getTime();

            // Update the start by incrementing it by the delta
            this.startTime = new Date(this.startTime.getTime() + delta);

            // Update the current time with the new time and display it
            this.currentTime = newTime;
            this.updateTimeDisplay(newTime);

            // If there's an onNewStartTime listener then call it
            if (this.onNewStartTime) this.onNewStartTime(this.startTime);
        }

    }

    updateTimeDisplay(time) {
        this.playbackTime.innerHTML = formatTimeForDisplay(time);
    }

    getTimeFromKnob() {
        const percent = (this.sliderKnob.offsetLeft + this.sliderKnob.offsetWidth / 2) / this.sliderBack.offsetWidth;
        return new Date(this.startTime.getTime() + this.duration * percent);
    }

    getTimeFromStart(time) {
        return time.getTime() - this.startTime.getTime();
    }

    setTime(newTime, updateVideo) {

        let timeSinceStart = 0; 

        if (newTime instanceof Date) {
            this.currentTime = newTime; 
            timeSinceStart = this.getTimeFromStart(newTime);
        }
        else {
            timeSinceStart = newTime * 1000;
            this.currentTime = new Date(this.startTime.getTime() + timeSinceStart);
            newTime = this.currentTime;
        }

        // Don't let the time be before the movie starts or after it ends
        if (timeSinceStart < 0) timeSinceStart = 0; 
        if (timeSinceStart > this.duration) timeSinceStart = this.duration;

        // Calculate the new position for the knob
        const percent = timeSinceStart / this.duration;
        const newPos = this.sliderBack.offsetWidth * percent;
        
        // Position the knob and duration slider
        this.sliderKnob.style.left = newPos + 'px';
        this.durationBar.style.width = newPos + 'px';

        // Update the time
        this.updateTimeDisplay(newTime);
        
        // If updateVideo is true then update the video to the new time
        if (updateVideo) {
            this.updateVideo(newTime);
        }
    }

    formatPlaybackTime(time) {
        return `${leftPad(time.getHours(),2,0)}:${leftPad(time.getMinutes(),2,0)}:${leftPad(time.getSeconds(),2,0)}`;
    }

    updateVideo(time) {
        const timeSinceStart = this.getTimeFromStart(time);
        this.video.currentTime = timeSinceStart/1000;
    
        if (this.onTimeUpdate) this.onTimeUpdate(time);
    }

}