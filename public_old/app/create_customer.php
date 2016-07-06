<?
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
					"email" => "vesalink@gmail.com",
					"verified_email" => true,
					"send_email_invite" => true,
					"accepts_marketing" => true,
					)
			);
		$customer = $shopify('POST /admin/customers.json', $params);
		//print_r($customer);


		# Making an API request can throw an exception

	}
	catch (shopify\ApiException $e)
	{
		# HTTP status code was >= 400 or response contained the key 'errors'
		echo $e;
		print_R($e->getRequest());
		print_R($e->getResponse());
	}
	catch (shopify\CurlException $e)
	{
		# cURL error
		echo $e;
		print_R($e->getRequest());
		print_R($e->getResponse());
	}

?>