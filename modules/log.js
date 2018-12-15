
import {makeHttpRequest} from './helper.js';

export class Log {
    
    constructor(startTime = new Date(), fileName, id, weather, notes) {

        // If starttime is a string try and create a date from it and then assign it. 
        // Otherwise it's a date and it can be assigned directly. 
        this.startTime = typeof startTime == "string" ? new Date(startTime) : startTime
        this.data = [];
        this.currentCount = 0; 
        this.fileName = fileName; 
        this.id = id;
        this.weather = weather;
        this.notes = notes;
        this.redoCache = [];
    }

    addData(count, time = new Date()) {
        count = parseInt(count);
        this.currentCount += count;

        const delta = time.getTime() - this.startTime.getTime();

        this.data.push({time: delta, count});
        this.redoCache = [];

        this.syncWithDb();
    }


    getDataByTimeInterval(startTime,duration) {

        const startDelta = startTime.getTime() - this.startTime.getTime();
        const endDelta = startDelta + duration; 

        var startIndex = this.data.findIndex(function(data){
            return data.time >= startDelta;
        })

        var endIndex = this.data.findLastIndex(function(data){
            return data.time <= endDelta;
        });

        return this.data.slice(startIndex,endIndex+1)
            .map(entry => {
                return {count: entry.count, time: new Date(this.startTime.getTime() + entry.time)}
            });

    }

    incrementTime(increment) {
        this.startTime = new Date(this.startTime.getTime() + increment);

        let data = {
            'date': this.startTime
        }

        makeHttpRequest(`api/logs/${this.id}`,'PATCH',JSON.stringify(data),'application/json')
        .then(res => {
            console.log(res);
        })
        .catch(error => {
            console.log("error", error)
        });

    }


    addLogToDb() {

        this.addingToDb = true;

        return new Promise((resolve, reject) => {

            // Grab the data that hasn't been uploaded yet and set its upload status to pending
            let data = this.data;
            data.forEach(entry => {entry.uploaded = "pending"})

            // Build the object that will be sent to the API
            let body = {
                'date': this.startTime, 
                'fileName': this.fileName, 
                'weather': this.weather,
                'notes': this.notes,
                'data': data
            }

            makeHttpRequest('api/logs','POST',JSON.stringify(body),'application/json')
            .then(res => {
                res = JSON.parse(res);
                this.id = res.logId;
                this.addingToDb = false;

                data.forEach(entry => {entry.uploaded = true});

                console.log("log id: "+this.id);
                resolve(res);
            })
            .catch(error => {
                this.addingToDb = false;
                console.log("error in addlogtodb", error)
                reject(error);
            });

        });

    }

    syncWithDb() {
        // If there isn't an ID and we're not already trying to get the ID add the log to the database
        if (!this.id && !this.addingToDb) {
            this.addLogToDb()
                .then(() => {
                    this.syncWithDb();
                })
                .catch(error => {
                    console.log("error in syncwith db", error);
                }) 
        }
        // Otherwise add the new entries
        else if (this.id && !this.addingToDb) {
            // Get the entries that haven't been uploaded yet
            let data = this.data.filter(entry => !entry.uploaded)

            if (data.length) {
                //  Add a pending state to each entry
                data.forEach(entry => {
                    entry.uploaded = "pending"; 
                })

                makeHttpRequest(`api/logs/${this.id}`,'POST',JSON.stringify(data),'application/json')
                .then(res => {
                    res = JSON.parse(res);

                    // Update each entry with the uploaded status (true if the call was successful, false otherwise)
                    data.forEach(entry => {
                        entry.uploaded = res.success ? true : false;
                    })
                    
                })
                .catch(error => {
                    data.forEach(entry => {
                        entry.uploaded = false;
                    })

                    console.log("error", error)
                });
            }
        }
    }


    getCountByInterval(interval) {

        var intervalData = [];
    
        if (this.data.length > 0 && interval) {
    
            var interval = interval * 1000; 
            var data = this.data.slice(0);

            data = data.map(entry => {
                return {count: entry.count, time: new Date(this.startTime.getTime() + Number(entry.time))}
            });
    
            // Get the starting time by rounding the first time down to the nearest inteval
            var currentInterval = new Date(Math.floor(data[0].time / interval) * interval);
            var currentCount = 0; 
    
            // While there are still items in the data array 
            while (data.length > 0) {
    
                // If the entry is in the current interval add it to the count
                if (data[0].time < new Date(currentInterval.getTime() + interval)) {
                    var count = data.shift().count;
                    currentCount += count;
                }
    
                // If the entry isn't in the current interval
                else {
                    // Push the previous time / count to the intervalData array
                    intervalData.push({time: currentInterval, count: currentCount})
    
                    // Increment the current interval by the interval time and reset the count to 0
                    currentInterval = new Date(currentInterval.getTime() + interval);
                    currentCount = 0; 
                }
    
            } 
    
            // Add the last time to the intervalData array
            intervalData.push({time: currentInterval, count: currentCount})
    
        }
    
        return intervalData;
    
    }
    
    getTotalByInterval(interval) {
    
        var runningTotal = 0; 
    
        // Get the interval counts
        var intervals = this.getCountByInterval(interval);
    
        // Iterate through the intervals
        intervals.forEach(function(interval) {
            // Add the interval's count to the running total
            runningTotal += interval.count;
            // Replace the interval's count with the running total
            interval.runningTotal = runningTotal; 
        })
    
        return intervals;
    
    
    }

    undo() {
        let entry = this.data.pop();

        if (entry) {
            this.currentCount -= entry.count;
            this.redoCache.push(entry);
        }

    }

    redo() {
        let entry = this.redoCache.pop();
        
        if (entry) {
            this.currentCount += entry.count;
            this.data.push(entry);
        }
    }




    static fromId(id) {

        return new Promise((resolve, reject) => {

            makeHttpRequest(`api/logs/${id}`,'GET')
            .then(res => {
                res = JSON.parse(res);
                
                console.log(res);

                let log = new Log(new Date(res.start_time), res.file_name, res.id);
                log.data = res.entries.map(entry => {
                    return {count: Number(entry.count), time: Number(entry.time)}
                });
    
                resolve(log);
    
            })

        });

    }    
    
    
    static async fromId2(id) {

            var res = await makeHttpRequest(`api/logs/${id}`,'GET');

            res = JSON.parse(res);

            console.log(res);

            let log = new Log(new Date(res.start_time), res.file_name, res.log_id, res.weather, res.notes);
            log.data = res.entries.map(entry => {
                return {count: Number(entry.count), time: Number(entry.time), uploaded: true}
            });

            return log;
    
    }
    
    


}

Array.prototype.findLastIndex = function(test) {

    for (var i = this.length-1; i >= 0; i--) {
        if (test(this[i]))
            return i;
    }

    return 0;

}


export class OfflineLog extends Log {

    addData(count, time = new Date()) {
        count = parseInt(count);
        this.currentCount += count;
        const delta = time.getTime() - this.startTime.getTime();
        this.data.push({time: delta, count});
        this.redoCache = [];
        this.saveInProgress();
    }

    generateLocalStorageObject() {
        let obj = {};
        obj.startTime = this.startTime;
        obj.data = this.data;
        return obj;
    }

    generateDBInsertObject() {
        // Build the object that will be sent to the API
        let body = {
            'date': this.startTime, 
            'fileName': this.fileName, 
            'weather': this.weather,
            'notes': this.notes,
            'data': this.data
        }
        return body;
    }

    saveInProgress() {
        localStorage.setItem('currentLog', JSON.stringify(this.generateLocalStorageObject()));
    }

    static fromData(data) {
        let log = new OfflineLog(data.startTime, undefined, undefined, data.weather, data.notes);
        log.data = data.data;
        return log; 
    }

}