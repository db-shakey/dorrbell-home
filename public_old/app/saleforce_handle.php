<?php
        //set POST variables
        $url = 'https://www.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8';

        foreach ($_POST as $key => $post_value) {
        	if($key != "submit") {
        		$fields[$key] = $post_value;
        	}
        }
        /*$fields = array(
                                'zip'=>urlencode($_POST['zip']),
                                'email'=>urlencode($_POST['email']),
                                'oid' => $_POST['oid'], // insert with your id
                                '00N1a000003zToe' => 'Private Beta Customer', 
                                '00N1a000006AfJU' => '1', 
                                'retURL' => urlencode($_POST['retURL']), // sending this just in case
                                'debug' => '1',
                                'debugEmail' => urlencode("vesalink@gmail.com"), // your debugging email
                        );
        */
        //url-ify the data for the POST
        foreach($fields as $key=>$value) { $fields_string .= $key.'='.$value.'&'; }
        $fields_string = rtrim($fields_string,'&');

        //open connection
        $ch = curl_init();
        
        //set the url, number of POST vars, POST data
        curl_setopt($ch,CURLOPT_URL,$url);
        curl_setopt($ch,CURLOPT_POST,count($fields));
        curl_setopt($ch,CURLOPT_POSTFIELDS,$fields_string);
        
        curl_setopt($ch,CURLOPT_SSL_VERIFYPEER, FALSE);
        curl_setopt($ch,CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch,CURLOPT_FOLLOWLOCATION, TRUE);
        
        //execute post
        $result = curl_exec($ch);
      
        //close connection
        curl_close($ch);

$found = false;
if (($handle = fopen(__DIR__."/portland_zip_codes.csv", "r")) !== FALSE) {
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
            if ($data[0] == $_POST['zip']) {
            	$found = true;
            }
    }
    fclose($handle);
}

if ($found) {

	//session_start();

	require __DIR__.'/conf.php';
	require __DIR__.'/http.php';
	require __DIR__.'/shopify.php';

	$shopify = shopify\client(SHOPIFY_SHOP, SHOPIFY_APP_API_KEY, SHOPIFY_APP_PASSWORD, true);

	try
	{
		# Making an API request can throw an exception
		$params = array(
				"customer" => array(
					"email" => $_POST['email'],
					//"verified_email" => true,
					//"send_email_invite" => false,
					"accepts_marketing" => true,
					)
			);
		$customer = $shopify('POST /admin/customers.json', $params);
		//print_r($customer);
	}
	catch (shopify\ApiException $e)
	{
		# HTTP status code was >= 400 or response contained the key 'errors'
		//echo $e;
		//print_R($e->getRequest());
		//print_R($e->getResponse());
		mail("vesalink@gmail.com", "Dorrbell Debug", "<pre>" . print_r($e, true). "</pre>"."<pre>" . print_r($e->getRequest(), true). "</pre>"."<pre>" . print_r($e->getResponse(), true). "</pre>", "MIME-Version: 1.0\r\nContent-type:text/html;charset=UTF-8\r\n");
		mail("joshua@dorrbell.com", "Dorrbell Debug", "<pre>" . print_r($e, true). "</pre>"."<pre>" . print_r($e->getRequest(), true). "</pre>"."<pre>" . print_r($e->getResponse(), true). "</pre>", "MIME-Version: 1.0\r\nContent-type:text/html;charset=UTF-8\r\n");
	}
	catch (shopify\CurlException $e)
	{
		# cURL error
		//echo $e;
		//print_R($e->getRequest());
		//print_R($e->getResponse());
	}

}

?>