import {formatTimeForDisplay} from './helper.js';

export class Graph {
        
    constructor(div, log, startTime, duration) {
        
        this.div = div;
        this.canvas = div.getElementsByTagName('canvas')[0];
        this.ctx = this.canvas.getContext('2d');
        this.divWidth = div.offsetWidth;
        this.width = this.ctx.canvas.width;
        this.height = this.ctx.canvas.height;
        this.log = log;
        this.startTime = startTime;
        this.duration = duration;
        this.timeScale = new TimeScale(this);

    } 

    handleMouseOver(e) {
        var pos = e.offsetX;
        
        var clickTime = this.getTimeByPos(pos);

        var videoTime = (clickTime.getTime() - this.startTime.getTime()) / 1000;
        
        video.currentTime = videoTime;
        console.log(videoTime)
    }

    handleMouseMove(e) {
        var offset = e.pageX - this.div.offsetLeft;

        var time = this.getTimeByPos(offset);

        var timeDisplay = formatTimeForDisplay(time);

        this.currentPos.style.left = offset + 'px';
        this.timeDisplay.innerHTML = timeDisplay;

    }

    renderGraph(currentTime) {
        var ctx = this.ctx;

        // Clear the canvas
        ctx.clearRect(0,0,this.width,this.height);
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, this.width, this.height);

        // y axis
        ctx.strokeStyle = 'white';
        ctx.lineWidth = '1';
        ctx.beginPath();
        ctx.moveTo(0, this.height/2);
        ctx.lineTo(this.width, this.height/2);
        ctx.stroke();

        // Current time
        ctx.beginPath();
        ctx.moveTo(this.width/2,0);
        ctx.lineTo(this.width/2,this.height);
        ctx.stroke();

        var startTime = new Date(currentTime.getTime() - (this.duration / 2))
        // this.startTime = startTime;

        // this.buildTimeScale(startTime);
        this.timeScale.drawTimeScale(startTime);

        var intervalData = this.log.getDataByTimeInterval(startTime, this.duration);

        intervalData.forEach(function(data) {
            var dataPos = (data.time.getTime() - startTime.getTime())/this.duration*this.width;
            ctx.fillStyle = data.count > 0 ? 'white' : 'red';
            ctx.fillRect(dataPos,(this.height/2),4,-1 * ((this.height/2) * data.count / 5));
        },this)

    }

    getPosByTime(time, startTime) {
        return (time.getTime() - startTime.getTime())/this.duration*this.width;
    }

    getTimeByPos(pos) {
        return new Date(this.startTime.getTime() + pos/this.divWidth*this.duration);
    }

    getTimeScaleIncrement() {
        var increments = [1,5,15,30,60,120,300,600];

        var idealIncrement = this.duration/6/1000;

        for (var i = 0; i < increments.length; i++) {
            if (increments[i] > idealIncrement)
                break;
        }

        return (increments[i-1] ? increments[i-1] : increments[0]) * 1000;
    }

}


class TimeScale {

    constructor(graph) {
    this.graph = graph; 
    this.incrementLength = this.getTimeScaleIncrement([1,5,10,15,30,60,120,300,600]);
    }

    getTimeScaleIncrement(increments) {
        
        var idealIncrement = this.graph.duration/6/1000;

        for (var i = 0; i < increments.length; i++) {
            if (increments[i] > idealIncrement)
                break;
        }

        return (increments[i-1] ? increments[i-1] : increments[0]) * 1000;
    }

    drawTimeScale(startTime) {

        // Setup the drawing paramaters
        var ctx = this.graph.ctx;         
        ctx.strokeStyle = 'white';
        ctx.lineWidth = '1';
        ctx.font = '20px Arial';
        ctx.fillStyle = "white";
        ctx.textAlign = 'center'

        // Get the graph's end time
        var endTime = new Date(startTime.getTime() + this.graph.duration)

        // Determine the first increment
        var increment = new Date(Math.ceil(startTime.getTime() / 1000) * 1000);

        // Output the increments
        while (increment <= endTime) {
            // Get the increment's position
            var pos = this.graph.getPosByTime(increment, startTime);

            // Output larger hashes and the time for the main increments
            if (increment.getTime() % this.incrementLength == 0) {
                // Output the hash mark
                ctx.beginPath();
                ctx.moveTo(pos,this.graph.height - 20);
                ctx.lineTo(pos,this.graph.height);
                ctx.stroke();

                // Output the time text
                var intervalTime = formatTimeForDisplay(increment);
                ctx.fillText(intervalTime, pos, this.graph.height - 30);              
            }

            // Otherwise output smaller hashes for each second that isn't a main increment
            else {
                ctx.beginPath();
                ctx.moveTo(pos,this.graph.height - 10);
                ctx.lineTo(pos,this.graph.height);
                ctx.stroke();
            }

            // Add the interval time to the increment
            increment = new Date(increment.getTime() + 1000);
        }
        
    }
}