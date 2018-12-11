<?php

include ("../include/login.php");




// GET 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {


    // /logs/$log_id
    if ($_GET['log_id']) {
        $query = "SELECT * FROM logs WHERE log_id = ".$_GET['log_id'];
        $result = $mysqli->query($query) OR DIE($mysqli->error);
        $logRow = $result->fetch_assoc();

        $datetime = new DateTime($logRow['date']);
        $isodata = $datetime->format(DateTime::ATOM);

        $data = array(
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



// /logs
// List of all logs
    else {
        $query = "SELECT logs.log_id, date, sum(entries.count) as count, weather, notes FROM logs
        left join entries on entries.log_id = logs.log_id
        group by logs.log_id
        ORDER BY logs.date DESC";
        $result = $mysqli->query($query) OR DIE($mysqli->error);

        $data = array();
        
        while ($row = $result->fetch_assoc()) {

            $datetime = new DateTime($row['date']);
            $isodata = $datetime->format(DateTime::ATOM);
            
            $data[] = array(
                'id'=>$row['log_id'], 
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

        $date = date ("Y-m-d H:i:s", strtotime($data['date']));

        $filename = $mysqli->real_escape_string($data['fileName']);
        $weather = $mysqli->real_escape_string($data['weather']);
        $notes = $mysqli->real_escape_string($data['notes']);


        $query = "INSERT INTO logs (date, file_name, weather, notes) VALUES ('$date','$filename','$weather','$notes')";
        $result = $mysqli->query($query) OR DIE($mysqli->error);

        $log_id = $mysqli->insert_id;
        
        $data = array('logId' => $log_id);
        header('Content-type: application/json');
        echo json_encode($data);

        // $query = "INSERT INTO entries (log_id, time, count) VALUES ";

        // $inserts = Array();
        // foreach ($data['data'] as $entry) {
        //     $inserts[] = "('".$log_id."','".$entry['time']."','".$entry['count']."')";
        // }

        // $query .= implode(",",$inserts);

        // echo $query."\n";
        
        // $result = $mysqli->query($query) OR DIE($mysqli->error);
        // echo $result;
    }

}

// Patch
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    
    $data = json_decode(file_get_contents('php://input'), true);

    // /logs/$log_id
    if ($_GET['log_id']) {

        print_R($data);

        
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

        $query .= implode(",",$updates);
        $query .= " WHERE log_id = $log_id";

        $result = $mysqli->query($query) OR DIE($mysqli->error);

        // echo $query;
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




?>

