<?php
$found = "false";
if (($handle = fopen(__DIR__."/portland_zip_codes.csv", "r")) !== FALSE) {
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if ($data[0] == $_GET['zip_code']) {
            	$found = "true";
            }
    }
    fclose($handle);
}
echo $found;
?>