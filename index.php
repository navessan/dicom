<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
<title>efilm</title>

<meta content="text/html; charset=windows-1251" name="Content">
<meta http-equiv="Content-Type"
	content="text/html; charset=windows-1251">
<meta name="keywords"
	content="web, database, gui, efilm">
<meta name="description"
	content="web database gui efilm">

</head>
<body>

<?php

/* Default database settings*/
$database_type = "mssql";
$database_default = "eFilmWorkstation";
$database_hostname = "localhost";
$database_username = "sa";
$database_password = "eFilmWS30";
$database_port = "";

$debug=0;
/* display ALL errors */
error_reporting(E_ALL);

/* Include configuration */
include("config.php");

require_once "lib/nanodicom-1.3/nanodicom.php";

/* Display errors. */
function FormatErrors( $errors )
{
	echo "Error information: <br/>";
	foreach ( $errors as $error )
	{
		echo "SQLSTATE: ".$error['SQLSTATE']."<br/>";
		echo "Code: ".$error['code']."<br/>";
		echo "Message: ".$error['message']."<br/>";
	}
}

/* sanitize_search_string - cleans up a search string submitted by the user to be passed
     to the database. NOTE: some of the code for this function came from the phpBB project.
   @arg $string - the original raw search string
   @returns - the sanitized search string */
function sanitize_search_string($string) {
	static $drop_char_match =   array('^', '$', '<', '>', '`', '\'', '"', '|', ',', '?', '~', '+', '[', ']', '{', '}', '#', ';', '!', '=');
	static $drop_char_replace = array(' ', ' ', ' ', ' ',  '',   '', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ');

	/* Replace line endings by a space */
	$string = preg_replace('/[\n\r]/is', ' ', $string);
	/* HTML entities like &nbsp; */
	$string = preg_replace('/\b&[a-z]+;\b/', ' ', $string);
	/* Remove URL's */
	$string = preg_replace('/\b[a-z0-9]+:\/\/[a-z0-9\.\-]+(\/[a-z0-9\?\.%_\-\+=&\/]+)?/', ' ', $string);

	/* Filter out strange characters like ^, $, &, change "it's" to "its" */
	for($i = 0; $i < count($drop_char_match); $i++) {
		$string =  str_replace($drop_char_match[$i], $drop_char_replace[$i], $string);
	}

	$string = str_replace('*', ' ', $string);

	return $string;
}

/* get_request_var_post - returns the current value of a PHP $_POST variable, optionally
     returning a default value if the request variable does not exist
   @arg $name - the name of the request variable. this should be a valid key in the
     $_POST array
   @arg $default - the value to return if the specified name does not exist in the
     $_POST array
   @returns - the value of the request variable */
function get_request_var_post($name, $default = "") {
	if (isset($_POST[$name])) {
		if (isset($_GET[$name])) {
			unset($_GET[$name]);
			$_REQUEST[$name] = $_POST[$name];
		}

		return $_POST[$name];
	}else{
		return $default;
	}
}

function display_search_form()
{
	print '<p>';
	print 'POST:';
	print_r($_POST);
	print '<br>GET:';
	print_r($_GET);
	print '<br>REQUEST:';
	print_r($_REQUEST);
	print '</p>';
	
}

if (isset($_REQUEST['phpinfo']))
{
	phpinfo();
	die( "exit!" );
}
if (isset($_REQUEST['debug']))
{
	$debug=1;
}

$connectionInfo = array( "UID"=>$database_username,
                         "PWD"=>$database_password,
                         "Database"=>$database_default/*,
						 "ReturnDatesAsStrings" => true*/);

/* Connect using SQL Server Authentication. */
$conn = sqlsrv_connect( $database_hostname, $connectionInfo);
if( $conn === false )
{
     echo "Unable to connect.</br>";
     die( FormatErrors( sqlsrv_errors() ) );
}


//-------------------
if(isset($debug))
	if($debug==1) display_search_form();
//-------------------

$fields_array=array(
		'PATIENTUID'=>array(
				"name"=>''
				,"type"=>"text"
				,"visible"=>0),
		'STUDYINSTANCEUID'=>array(
				"name"=>''
				,"visible"=>0),
		'STUDYID'=>array(
				"name"=>''
				,"visible"=>0),
		'ACCESSIONNUMBER'=>array(
				"name"=>''
				,"type"=>"text"
				,"visible"=>0),
		'SERIESINSTANCEUID'=>array(
				"name"=>''
				,"type"=>"text"
				,"visible"=>0),
		'FRAMEOFREFERENCEUID'=>array(
				"name"=>''
				,"type"=>"text"
				,"visible"=>0)
);

$fields_search_array=array(
array("post"=>'PatientID',"sql"=>'Patient.PatientID',"name"=>"PatientID","value"=>"","html"=>"<br>","type"=>"text"),
array("post"=>'PatientsName',"sql"=>"PatientsName","name"=>"PatientsName","value"=>"","type"=>"text"),
array("post"=>'StudyDate',"sql"=>"StudyDate","name"=>"StudyDate","value"=>"","type"=>"text"),
array("post"=>'ProtocolName',"sql"=>"ProtocolName","name"=>"ProtocolName","value"=>"","html"=>"<br>","type"=>"text")		
);


if (isset($_REQUEST["series"]))
	process_series2($conn,$_REQUEST["series"]);

echo '<form method=post>';

//вывод полей для поиска с заполнением значений
for($i=0;$i<count($fields_search_array);$i++)
{
	$field=$fields_search_array[$i];
	$field['value']=get_request_var_post($field['post']);
	$field['value']=sanitize_search_string($field['value']);
	$field['value']=trim($field['value']);
	if($field['type']=="datetime")
		$field['value']=str_replace(array('\'', '-', '.', ',', ' ', '/'), '-', $field['value']);
	if(isset($field['html']))
		echo $field['html'];		
	echo $field['name'].': <input type=text name="'.$field['post'].'" value="'.$field['value'].'">';
	$fields_search_array[$i]=$field;
}

echo '		<input type=submit name=send value=search>
	</form>';


$sql_where="";

foreach ($fields_search_array as $field)
{
	if(strlen($field['value'])>0)
	{			
			if(strlen($sql_where)>0)
				$sql_where.=" and ";
			$sql_where.=$field['sql']." like '".$field['value']."%'";
	}
}

if(isset($debug))
	if($debug==1) echo $sql_where;


$top_count=60;

/* Set up and execute the query. */
//--------------------------------------
$tsql = "SELECT top $top_count
Patient.[PatientID]
      ,Patient.[PatientsName]
      ,Patient.[PatientsBirthDate]
      ,Patient.[PatientsSex]
      ,Patient.[PatientUID]

      ,Study.[StudyInstanceUID]
      ,Study.[StudyDate]
      ,Study.[StudyID]
      ,Study.[AccessionNumber]
      ,Study.[Modality]

,Series.SeriesNumber
,[ProtocolName]
,[SeriesDescription]
,SeriesInstanceUID
,[FrameOfReferenceUID]
,(select count(*) from Image where Image.SeriesInstanceUID=Series.SeriesInstanceUID) imagesCount
  FROM Patient
join Study on Study.PatientUID=Patient.PatientUID
join Series on Study.StudyInstanceUID=ReferencedStudyComponent

";


if(strlen($sql_where)>0)
	$tsql.="\n where ".$sql_where;

$tsql.="\n order by PatientsName";


/*Execute the query with a scrollable cursor so
  we can determine the number of rows returned.*/
//$cursorType = array("Scrollable" => SQLSRV_CURSOR_KEYSET);
//$stmt = sqlsrv_query( $conn, $tsql,null,$cursorType);

$stmt = sqlsrv_query($conn, $tsql);

if( $stmt === false)
{
     echo "Error in query preparation/execution.\n";
     die( FormatErrors( sqlsrv_errors() ) );
}

if(sqlsrv_has_rows($stmt))
{
	$numRows = sqlsrv_num_rows($stmt);
	echo "<p>$numRows Row" . ($numRows == 1 ? "" : "s") . " Returned </p>";
	
	print '<table cellspacing="0" cellpadding="1" border="1" align="center"
	width="100%">
	<tbody>';
	echo '<tr>';
	
	$metadata=sqlsrv_field_metadata($stmt);
	
	$column_name="";

	//internal column names
	for ($i=0;$i < count($metadata);$i++)
	{
		$meta = $metadata[$i];
		//print_r($meta);
		$column_name=strtoupper($meta['Name']);
		
		if(get_column_visibility($column_name)==1)
			echo '<td>' . $meta['Name'] . '</td>';
	}
	echo '</tr>';
	
	//human readable column names
	echo '<tr>';
	for ($i=0;$i < count($metadata);$i++)
	{
		$meta = $metadata[$i];
		$column_name=strtoupper($meta['Name']);
		//print_r($meta);
		$header=get_column_username($column_name,"&nbsp");
		
		if(get_column_visibility($column_name)==1)
			echo '<td>' . $header . '</td>';
	}
	echo '</tr>';


	/* Retrieve each row as an associative array and display the results.*/
	while( $row = sqlsrv_fetch_array( $stmt, SQLSRV_FETCH_ASSOC))
	{
		$rowColor='White';
		echo '<tr bgcolor="' . $rowColor . '">';
		//echo '<tr bgcolor="' . $rowColor . '" onclick=\'location.href="'.$row['StudyInstanceUID'].'"\'>';
		//print_r($row);
		
		for ($i=0;$i < count($row);$i++)
		{
			$column_name=$metadata[$i]['Name'];
					
			if(get_column_visibility(strtoupper($column_name))==1)
			{					
				$field=$row[$column_name];
				$text='';
					
				if (gettype($field)=="object" && (get_class($field)=="DateTime"))
				{
					$text = $field->format('Y-m-d');
					if($text=='1899-12-30')
						$text="&nbsp";
				}
				else
					$text = trim($field);

				if($text=='')
					$text ='&nbsp';
				
				if(strtoupper($column_name)=='SERIESDESCRIPTION')
				{
					echo '<td><form method=post>
					<input type="hidden" name=series value="'.$row['SeriesInstanceUID'].'">';
					//"<a href="index.php?action=series&uid='.$row['SeriesInstanceUID'].'">' . $text . '</a></td>';
					echo '		<input type=submit name=process value="'.$row['SeriesDescription'].'"></form>';
				}
				else					
					echo '<td>' . $text . '</td>';
			}
		}
		print "</a></tr> \n";
	}
	print '	</tbody>
	</table>';
}
else 
{
	echo "No rows returned.";
}
/* Free statement and connection resources. */
sqlsrv_free_stmt( $stmt);
sqlsrv_close( $conn);

function process_series($conn,$uid)
{
	$uid=trim(sanitize_search_string($uid));
	
	if(strlen($uid)>0)
	{
		echo "finding Series UID=".$uid."<br>\n";
	}
	else 
	{
		echo "Wrong Series UID!";
		return ;
	}
	
	$SOPInstanceUID="";
	$SeriesInstanceUID="";
	$StudyInstanceUID="";
	$FrameOfReferenceUID="";
	
	$tsql="SELECT top 1
	[SOPInstanceUID]
    ,[SeriesInstanceUID]
    ,[StudyInstanceUID]
	,FrameOfReferenceUID
  FROM Image
where SeriesInstanceUID='".$uid."'";
	
	$stmt = sqlsrv_query($conn, $tsql);
	
	if( $stmt === false)
	{
		echo "Error in query preparation/execution.\n";
		die( FormatErrors( sqlsrv_errors() ) );
	}
	
	if(sqlsrv_has_rows($stmt))
	{
		/* Retrieve each row as an associative array and display the results.*/
		while( $row = sqlsrv_fetch_array( $stmt, SQLSRV_FETCH_ASSOC))
		{

			$SOPInstanceUID=$row["SOPInstanceUID"];
			$SeriesInstanceUID=$row["SeriesInstanceUID"];
			$StudyInstanceUID=$row["StudyInstanceUID"];
			$FrameOfReferenceUID=$row["FrameOfReferenceUID"];
		}
	}
	/* Free statement and connection resources. */
	sqlsrv_free_stmt( $stmt);
	
	echo "SOPInstanceUID=".$SOPInstanceUID." <br>\n";
	echo "SeriesInstanceUID=".$SeriesInstanceUID." <br>\n";
	echo "StudyInstanceUID=".$StudyInstanceUID." <br>\n";
	echo "FrameOfReferenceUID=".$FrameOfReferenceUID." <br>\n";
	
	$output = shell_exec('process.bat '.$StudyInstanceUID.' '.$SeriesInstanceUID.' '.$FrameOfReferenceUID);
	echo "<pre>$output</pre>";
	
}

function process_series2($conn,$uid)
{
	global $dicom_config;
	global $debug;
	$uid=trim(sanitize_search_string($uid));

	if(strlen($uid)>0)
	{
		echo "finding Series UID=".$uid."<br>\n";
	}
	else
	{
		echo "Wrong Series UID!";
		return ;
	}

	$SOPInstanceUID="";
	$SeriesInstanceUID="";
	$StudyInstanceUID="";
	$FrameOfReferenceUID="";
	$PatientsName="";
	
	$tsql="SELECT top 1
	   Patient.[PatientID]
	  ,Patient.[PatientsName]
      ,Patient.[PatientsBirthDate]
      ,Patient.[PatientsSex]
      ,Patient.[PatientUID]

      ,Study.[StudyInstanceUID]
      ,Study.[StudyDate]
	  ,Study.StudyTime
      ,Study.[StudyID]
      ,Study.[AccessionNumber]
      ,Study.[Modality]

,Series.SeriesDate
,Series.SeriesTime
,Series.SeriesNumber
,Series.ProtocolName
,Series.SeriesDescription
,Series.BodyPartExamined
,Series.PatientPosition
,Series.SeriesInstanceUID
,Series.FrameOfReferenceUID

,Image.SOPInstanceUID
,Image.Manufacturer				
,Image.ManufacturersModelName
			
FROM Patient
join Study on Study.PatientUID=Patient.PatientUID
join Series on Study.StudyInstanceUID=ReferencedStudyComponent
join Image on Image.SeriesInstanceUID=Series.SeriesInstanceUID
where Image.SeriesInstanceUID='".$uid."'";

	$stmt = sqlsrv_query($conn, $tsql);

	if( $stmt === false)
	{
		echo "Error in query preparation/execution.\n";
		die( FormatErrors( sqlsrv_errors() ) );
	}
	
	$res=null;
	$row=null;

	if(sqlsrv_has_rows($stmt))
	{
		/* Retrieve each row as an associative array and display the results.*/
		while( $row = sqlsrv_fetch_array( $stmt, SQLSRV_FETCH_ASSOC))
		{
			$SOPInstanceUID=$row["SOPInstanceUID"];
			$SeriesInstanceUID=$row["SeriesInstanceUID"];
			$StudyInstanceUID=$row["StudyInstanceUID"];
			$FrameOfReferenceUID=$row["FrameOfReferenceUID"];
			$PatientsName=$row["PatientsName"];

			$res=$row;
		}
	}
	else 
	{
		echo "Series ".$uid." not found";
		return;
	}
	/* Free statement and connection resources. */
	sqlsrv_free_stmt( $stmt);
	
	$row=$res;
	//print_r($row);

	echo "SOPInstanceUID=".$SOPInstanceUID." <br>\n";
	echo "SeriesInstanceUID=".$SeriesInstanceUID." <br>\n";
	echo "StudyInstanceUID=".$StudyInstanceUID." <br>\n";
	echo "FrameOfReferenceUID=".$FrameOfReferenceUID." <br>\n";
	
	if(!isset($dicom_config["GDMTAR"]) or 0)
	{
		echo("GDMTAR is not set!");
		return;
	}
		
	//src="%dicomRoot%\%StudyUID%\%SeriesUID";
	//gdcmtar -V -i %src% -o %dst%
		
	$src=$dicom_config["DICOMROOT"]."\\".$StudyInstanceUID."\\".$SeriesInstanceUID;
	$dst=$dicom_config["TEMPDIR"];
	
	$cmd=$dicom_config["GDMTAR"]." -D -i ".$src." -o ".$dst." 2>&1";
	echo "<br>cmd=".$cmd;
	
	$output = shell_exec($cmd);
	echo "<p>$output</p>";
	
	
	//$cmd="dir /b ".$dicom_config["TEMPDIR"]."\\".$StudyInstanceUID."\\".$SeriesInstanceUID."\\".$FrameOfReferenceUID;
	//$output = shell_exec($cmd);
	//echo "<p>".iconv("CP866", "CP1251", $output)."</p>";
	
	$filename=$dicom_config["TEMPDIR"]."\\".$StudyInstanceUID."\\".$SeriesInstanceUID."\\".$FrameOfReferenceUID."\\new.dcm";
	
	if(!file_exists($filename))
	{
		echo "file ".$filename." not created!";
		return;
	}
		
	$tags=array(
			"PatientsName"=>'0010,0010'
			,"PatientID"=>'0010,0020'
			,"PatientsBirthDate"=>'0010,0030'
			,"PatientsSex"=>'0010,0040'
			
			,"StudyDate"=>'0008,0020'
			,"SeriesDate"=>'0008,0021'
			,"AcquisitionDate"=>'0008,0022'
			,"ContentDate"=>'0008,0023'
			,"StudyTime"=>'0008,0030'
			,"SeriesTime"=>'0008,0031'
			,"AcquisitionTime"=>'0008,0032'
			,"ContentTime"=>'0008,0033'
			,"AccessionNumber"=>'0008,0050'
			,"Manufacturer"=>'0008,0070'
			,"InstitutionName"=>'0008,0080'
			,"ManufacturersModelName"=>'0008,1090'
			,"SeriesDescription"=>'0008,103E'
			
			,"BodyPartExamined"=>'0018,0015'
			,"ScanOptions"=>'0018,0022'
			,"SliceThickness"=>'0018,0050'
			,"KVP"=>'0018,0060'
			,"DataCollectionDiameter"=>'0018,0090'
			,"ProtocolName"=>'0018,1030'
			,"ReconstructionDiameter"=>'0018,1100'
			,"GantryDetectorTilt"=>'0018,1120'
			,"TableHeight"=>'0018,1130'
			,"RotationDirection"=>'0018,1140'
			,"ExposureTime"=>'0018,1150'
			,"XRayTubeCurrent"=>'0018,1151'
			,"Exposure"=>'0018,1152'
			,"GeneratorPower"=>'0018,1170'
			,"ConvolutionKernel"=>'0018,1210'
			,"PatientPosition"=>'0018,5100'
			,"CTDIvol"=>'0018,9345'
			
			//,"StudyInstanceUID"=>'0020,000D'
			//,"SeriesInstanceUID"=>'0020,000E'
			,"StudyID"=>'0020,0010'			
			,"SeriesNumber"=>'0020,0011'
			//,"InstanceNumber"=>'0020,0013'
			,"PatientOrientation"=>'0020,0020'
			//,"FrameOfReferenceUID"=>'0020,0052'	
	);
	
	$src=$dicom_config["DICOMROOT"]."\\".$StudyInstanceUID."\\".$SeriesInstanceUID."\\".$SOPInstanceUID.".dcm";
	
	//copy_dicom_tags($src, $filename, $tags);
	copy_dicom_tags_with_modify($src, $filename, $tags);
	
	/*
	if(strlen($PatientsName)>0)
	{
		$cmd=$dicom_config["DCMODIFY"].' -i "(0010,0010)='.$PatientsName.'" '.$filename." 2>&1";
		echo "<br>cmd=".$cmd;

		$output = shell_exec($cmd);
		echo "<p>".iconv("CP866", "CP1251", $output)."</p>";
	}
	*/
	
	//moving file
	$cmd='copy '.$filename .' "'.$dicom_config["OUTDIR"]."\\"
						.$PatientsName." "
						//.$row["StudyDate"]." "
						.$row["SeriesDescription"]
						.'.dcm" 2>&1';
	echo "<br>cmd=".$cmd;
	
	$output = shell_exec($cmd);
	echo "<p>".iconv("CP866", "CP1251", $output)."</p>";
	
}

function copy_dicom_tags($src_file, $dst_file, $tags)
{
	if(strlen($src_file)==0 
			|| strlen($dst_file)==0
			|| ! is_array($tags))
		return;
	
	$src_dicom=null;
	$dst_dicom=null;
		
	try
	{
		$src_dicom = Nanodicom::factory($src_file);
		$src_dicom->parse();
		
		//$src_dicom->extend('dumper');
		//echo $src_dicom->parse()->dump('html');
		
		$dst_dicom = Nanodicom::factory($dst_file);
		$dst_dicom->parse();
		
		echo 'SRC Is DICOM? '.$src_dicom->is_dicom()."<br>\n";
		echo 'DST Is DICOM? '.$dst_dicom->is_dicom()."<br>\n";
		
		echo 'Patient Name: '.$src_dicom->value(0x0010, 0x0010)."<br>\n"; // Patient Name if exists
		echo 'Patient2 Name: '.$dst_dicom->value(0x0010, 0x0010)."<br>\n"; // Patient Name if exists
		
	}
	catch (Nanodicom_Exception $e)
	{
		echo 'File failed. '.$e->getMessage()."\n";
		return;
	}
	
	
	foreach ($tags as $fname=>$field)
	{
		if(strlen($field)>0)
		{
			$tag_numbers=explode(",", $field);
			
			$value=$src_dicom->value(hexdec($tag_numbers[0]), hexdec($tag_numbers[1]));
			
			echo $fname.'->'.$field."(".$tag_numbers[0].",".$tag_numbers[1].")="
				.$value
			."<br>\n";
			$dst_dicom->value(hexdec($tag_numbers[0]), hexdec($tag_numbers[1]), $value, true);
			//$dst_dicom	
			echo "new value=".$dst_dicom->value(hexdec($tag_numbers[0]), hexdec($tag_numbers[1]))."<br>\n";	
		}
	}
	
	try 
	{
		echo $dst_dicom->write_file($dst_file.'_2.dcm')->profiler_diff('write')."\n";
	}
	catch (Nanodicom_Exception $e)
	{
		echo '<br>Write file failed. '.$e->getMessage()."\n";
		return;
	}
	
	/*
	// 1) Workaround to create new elements for Nanodicom
	try
	{
		$dicom = Nanodicom::factory($filename, 'anonymizer');
		// Set Value (Patient Name here)
		$dicom->value(0x0010, 0x0010, 'JKD');
		//$dicom->value(0x0010, 0x0010, 'JKD'); Others as well
		$tags = array(
				array(0xF0ED, 0xF0ED, 'id{random}'),	// Non-existing tag. Sorry, needs one at least
		);
		$replacements = array(
				array(0x0010, 0x0010, 'JKD', 'JKD'),
				// array(0x0010, 0x0010, 'JKD', 'JKD'), Whatever was used above should be added here. Same value to be saved should be set for both last parameters
		);
		// Save the file with same name
		file_put_contents($filename, $dicom->anonymize($tags, $replacements));
	}
	catch (Nanodicom_Exception $e)
	{
		echo 'File failed. '.$e->getMessage()."\n";
	}
	*/
	
}

function copy_dicom_tags_with_modify($src_file, $dst_file, $tags)
{
	global $dicom_config;
	global $debug;
	
	if(strlen($src_file)==0
			|| strlen($dst_file)==0
			|| ! is_array($tags))
		return;

	$src_dicom=null;
	
	//read src file
	try
	{
		$src_dicom = Nanodicom::factory($src_file);
		$src_dicom->parse();

		//echo 'SRC Is DICOM? '.$src_dicom->is_dicom()."<br>\n";
		//echo 'Patient Name: '.$src_dicom->value(0x0010, 0x0010)."<br>\n"; // Patient Name if exists

	}
	catch (Nanodicom_Exception $e)
	{
		echo 'File failed. '.$e->getMessage()."\n";
		return;
	}

	//create string with tags
	$str='';
	
	foreach ($tags as $fname=>$field)
	{
		if(strlen($field)>0)
		{
			$tag_numbers=explode(",", $field);
				
			$value=$src_dicom->value(hexdec($tag_numbers[0]), hexdec($tag_numbers[1]));
			
			if($debug)
				echo $fname.'->'.$field."(".$tag_numbers[0].",".$tag_numbers[1].")=".$value."<br>\n";
			
			if(strlen($value)>0)
			{
				$str.=' -i "('.$field.')='.$value.'"';
					
			}
			//some tags cannot be written, check it separately
			/*
			$cmd=$dicom_config["DCMODIFY"].$str.' '.$dst_file." 2>&1";
			$output = shell_exec($cmd);
			if($debug)
			{
				echo "<br>cmd=".$cmd;
				echo "<p>".iconv("CP866", "CP1251", $output)."</p>";
			}
			 */
		}
	}
	
	//write all tags at once with dcmodify
	if(strlen($str)==0)
		return;
	
	$cmd=$dicom_config["DCMODIFY"].$str.' '.$dst_file." 2>&1";
		
	$output = shell_exec($cmd);
	if($debug)
	{
		echo "<br>cmd=".$cmd;
		echo "<p>".iconv("CP866", "CP1251", $output)."</p>";
	}

}

function get_column_visibility($name, $default = 1)
{
	global $fields_array;

	if (isset($fields_array[$name]['visible']))
		return $visible_flag=$fields_array[$name]['visible'];

	else
		return $default;
}
function get_column_username($name, $default = '')
{
	global $fields_array;

	if (isset($fields_array[$name]['name']))
		return $visible_flag=$fields_array[$name]['name'];

	else
		return $default;
}


?>

</body>
</html>
