<?php

include ("../include/login.php");


// GET 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // /logs/$log_id
    if ($_GET['log_id']) {
        $query = "SELECT * FROM logs 
        INNER JOIN logtypes ON logtypes.logtype_id = logs.logType
        WHERE log_id = ".$_GET['log_id'];
        $result = $mysqli->query($query) OR DIE($mysqli->error);
        $logRow = $result->fetch_assoc();

        $datetime = new DateTime($logRow['date']);
        $isodata = $datetime->format(DateTime::ATOM);

        $data = array(
            'log_type' => $logRow['logtype_name'],
            'log_id' => $logRow['log_id'], 
            'start_time' => $isodata, 
            'file_name' => $logRow['file_name'],
            'entries' => array(), 
            'weather' => $logRow['weather'],
            'notes' => $logRow['notes']
        );

        $query = "SELECT * FROM entries WHERE log_id = ".$_GET['log_id']." ORDER BY time";
        $result = $mysqli->query($query) OR DIE($mysqli->error);

        while ($row = $result->fetch_assoc()) {
            $data['entries'][] = array('time' => $row['time'], 'count' => $row['count']);
        }

        header('Content-type: application/json');
        echo json_encode($data);
        
    }

    // /years
    else if ($_GET['getyears']) {
        $query = "SELECT DISTINCT YEAR(date) as year FROM logs ORDER BY year DESC";
        $result = $mysqli->query($query) OR DIE($mysqli->error);

        $data = [];

        while ($row = $result->fetch_assoc()) {
            $data[] = $row['year'];
        }

        header('Content-type: application/json');
        echo json_encode($data);
    }



// /logs
// List of all logs
    else {
        $query = "SELECT logs.log_id, date, sum(entries.count) as count, weather, notes, logtype_name FROM logs
        left join entries on entries.log_id = logs.log_id
        LEFT JOIN logtypes ON logtypes.logtype_id = logs.logType";

        if ($_GET['year'])
            $query .= " WHERE YEAR(date) = '".$_GET['year']."'";

        $query .= " group by logs.log_id
        ORDER BY date DESC";

        $result = $mysqli->query($query) OR DIE($mysqli->error);

        $data = array();
        
        while ($row = $result->fetch_assoc()) {

            $datetime = new DateTime($row['date']);
            $isodata = $datetime->format(DateTime::ATOM);
            
            $data[] = array(
                'id'=>$row['log_id'], 
                'log_type'=>$row['logtype_name'],
                'date'=> $isodata, 
                'totalCount' => $row['count'],
                'weather' => $row['weather'],
                'notes' => $row['notes']
            );
            
        }

        header('Content-type: application/json');
        echo json_encode($data);
    }



}






// POST /logs
// Create a new log
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $data = json_decode(file_get_contents('php://input'), true);

    // /logs/$log_id
    if ($_GET['log_id']) {
        $log_id = $_GET['log_id'];

        $query = "INSERT INTO entries (log_id, time, count) VALUES ";

        $inserts = Array();
        foreach ($data as $entry) {
            $inserts[] = "('".$log_id."','".$entry['time']."','".$entry['count']."')";
        }

        $query .= implode(",",$inserts);

        
        $result = $mysqli->query($query) OR DIE($mysqli->error);
        
        $data = array('success' => $result == 1 ? true : false);
        header('Content-type: application/json');
        echo json_encode($data);

    }

    else {

        // Multiple Logs
        if (gettype($data[0]) == "array") {
            // Map each log in the array through the insertLog function
            $results = array_map("insertLog", $data);
            $returnData = array('logIds' => $results);
        }
        // Single Log
        else {
            $log_id = insertLog($data,$mysqli);
            $returnData = array('logId' => $log_id);
        }

        $returnData['postData'] = $data;

        header('Content-type: application/json');
        echo json_encode($returnData);

    }

}

// Patch
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    
    $data = json_decode(file_get_contents('php://input'), true);

    // /logs/$log_id
    if ($_GET['log_id']) {
        
        $log_id = $_GET['log_id'];

        $query = "UPDATE logs SET ";

        $updates = array();

        if ($data['date']) {
            $date = date ("Y-m-d H:i:s", strtotime($data['date']));
            $updates[] = "date = '".$date."'";
        }

        if ($data['file_name']) {
            $updates[] = "filename = '".$data['file_name']."'";
        }

        if (isset($data['notes'])) {
            $notes = $mysqli->real_escape_string($data['notes']);
            $updates[] = "notes = '".$notes."'";
        }

        if (isset($data['weather'])) {
            $weather = $mysqli->real_escape_string($data['weather']);
            $updates[] = "weather = '".$weather."'";
        }

        $query .= implode(",",$updates);
        $query .= " WHERE log_id = $log_id";

        $result = $mysqli->query($query) OR DIE($mysqli->error);

        echo $query;
        echo $result;

        // $query = "INSERT INTO entries (log_id, time, count) VALUES ";

        // $inserts = Array();
        // foreach ($data as $entry) {
        //     $inserts[] = "('".$log_id."','".$entry['time']."','".$entry['count']."')";
        // }

        // $query .= implode(",",$inserts);

        
        // $result = $mysqli->query($query) OR DIE($mysqli->error);
        
        // $data = array('success' => $result == 1 ? true : false);
        // header('Content-type: application/json');
        // echo json_encode($data);

    }
}



// DELETE /logs/{log_id}
// Create a new log
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    if ($_GET['log_id']) {

        $logDeleteQuery = "DELETE FROM logs WHERE log_id = ".$_GET['log_id'];
        $entriesDeleteQuery = "DELETE FROM entries WHERE log_id = ".$_GET['log_id'];

        $logResult = $mysqli->query($logDeleteQuery); // OR DIE($mysqli->error);
        $entriesResult = $mysqli->query($entriesDeleteQuery); // OR DIE($mysqli->error);

        $success = $logResult == 1 && $entriesResult == 1;

        $data = array('success' => $success);
        header('Content-type: application/json');
        echo json_encode($data);


    }

}


function insertLog($data) {

    global $mysqli;

        $date = date ("Y-m-d H:i:s", strtotime($data['date']));

        $filename = $mysqli->real_escape_string($data['fileName']);
        $weather = $mysqli->real_escape_string($data['weather']);
        $notes = $mysqli->real_escape_string($data['notes']);
        $logType = $data['logType'];

        // Get the logtype_id
        $query = "SELECT logtype_id FROM logtypes WHERE logtype_name = '$logType'";        
        $result = $mysqli->query($query) OR DIE($mysqli->error);
        $logtype_id = $result->fetch_assoc()['logtype_id'];


        $query = "INSERT INTO logs (logType, date, file_name, weather, notes) VALUES ('$logtype_id','$date','$filename','$weather','$notes')";
        
        
        $logResult = $mysqli->query($query) OR DIE($mysqli->error);

        $log_id = $mysqli->insert_id;
        
        // If there's data insert it into the entries table
        if ($data['data']) {
            $query = "INSERT INTO entries (log_id, time, count) VALUES ";

            $inserts = Array();
            foreach ($data['data'] as $entry) {
                $inserts[] = "('".$log_id."','".$entry['time']."','".$entry['count']."')";
            }
    
            $query .= implode(",",$inserts);        
            $entryResult = $mysqli->query($query) OR DIE($mysqli->error);
        }

        return $log_id;
}




?>

