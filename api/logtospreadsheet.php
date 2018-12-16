<?php

require '../vendor/autoload.php';
include ("../include/login.php");

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;


$id = $_GET['id'] ? $_GET['id'] : 0;
$utcOffset = $_GET['utc'] ? $_GET['utc'] : "+0"; 

$query = "SELECT * FROM logs 
INNER JOIN logtypes ON logtypes.logtype_id = logs.logType
WHERE log_id = '".$id."'";

$result = $mysqli->query($query) OR DIE($mysqli->error);
$logRow = $result->fetch_assoc();

$startTime = new DateTime($logRow['date'], new DateTimeZone("UTC"));

// Create new Spreadsheet object
$spreadsheet = new Spreadsheet();

// Add some data
$spreadsheet->setActiveSheetIndex(0)
    ->setCellValue('A1', 'Date')
    ->setCellValue('B1', $logRow['date'])
    ->setCellValue('A2', 'Notes')
    ->setCellValue('B2', $logRow['notes'])
    ->setCellValue('A3', 'Weather')
    ->setCellValue('B3', $logRow['weather']);


$query = "SELECT * FROM entries WHERE log_id = ".$id." ORDER BY time";
$result = $mysqli->query($query) OR DIE($mysqli->error);

while ($row = $result->fetch_assoc()) {
    $data[] = array('time' => $row['time'], 'count' => $row['count']);
}

// Parse the data into minute intervals
$intervals = (getTotalByInterval($data,60));


$spreadsheet->setActiveSheetIndex(0)
    ->setCellValue('A5', 'Minute Starting')
    ->setCellValue('B5', 'Count')
    ->setCellValue('C5', 'Running Total');


$startingRow = 6;
foreach($intervals as $k => $interval) {

    $currentRow = $startingRow + $k;

    $spreadsheet->setActiveSheetIndex(0)
    ->setCellValue('A'.$currentRow, $interval['time']->format('h:i'))
    ->setCellValue('B'.$currentRow, $interval['count'])
    ->setCellValue('C'.$currentRow, $interval['runningTotal']);
}



// Set active sheet index to the first sheet, so Excel opens this as the first sheet
$spreadsheet->setActiveSheetIndex(0);

// Redirect output to a client’s web browser (Xlsx)
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment;filename="01simple.xlsx"');
header('Cache-Control: max-age=0');

$writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
$writer->save('php://output');
exit;







function getTotalByInterval($data, $interval) {
    
    $runningTotal = 0; 

    // Get the interval counts
    $intervals = getCountByInterval($data, $interval);

    // Iterate through the intervals
    foreach($intervals as $k => $interval) {
        // Add the interval's count to the running total
        $runningTotal += $interval['count'];
        // Add the running total to each interval
        $intervals[$k]['runningTotal'] = $runningTotal;
    }

   return($intervals);
}


function getCountByInterval($data, $interval) {

    $intervalData = array();

    // Replace the time differential with datetime objects
    $data = array_map('processDbData', $data);

    // Get the starting time by rounding the first time down to the nearest interval
    $firstTimestamp = $data[0]['time']->getTimeStamp();
    $roundedTimestamp = floor(($firstTimestamp / $interval)) * $interval;
    $currentInterval = new DateTime();
    $currentInterval->setTimeZone(new DateTimeZone("UTC"));
    $currentInterval->setTimestamp($roundedTimestamp);
    
    $currentCount = 0; 
    $i = 0; 

    while (count($data) > 0 && $i < 10000) {
        
        $currentIntervalEnd = clone $currentInterval;
        $currentIntervalEnd->modify("+".$interval." sec");

        // If the entry is in the current interval add it to the count
        if ($data[0]['time'] < $currentIntervalEnd) {
            $count = array_shift($data)['count'];
            $currentCount += $count;
        }

        // If the entry isn't in the current interval
        else {
            // Push the previous time / count to the intervalData array
            $intervalData[] = ['time'=>clone $currentInterval, 'count'=>$currentCount];

            // Increment the current interval by the interval time and reset the count to 0
            $currentInterval->modify("+".$interval." sec");
            $currentCount = 0; 
        }

        $i++;

    }

    $intervalData[] = ['time'=>$currentInterval, 'count'=>$currentCount];

    return $intervalData;

}

function processDbData($row) {

    global $startTime;

    // Create a new date object
    $dt = new DateTime();
    $dt->setTimeZone(new DateTimeZone("UTC"));

    // Set the date object to the starttime unix timestamp + the time differential
    $dt->setTimestamp($startTime->getTimeStamp() + ($row['time'] / 1000));

    // return an array with the new date
    return ['time'=>$dt, 'count'=>$row['count']];

}





?>