<?php

/* make sure these values refect your actual database/host/user/password */
$database_type = "mssql";
$database_hostname = "dev-srv2";
$database_default = "eFilmWorkstation";
$database_username = "sa";
$database_password = "eFilmWS30";
$database_port = "";


$dicom_config=array(
		"GDMTAR"=>'C:\soft\dicom\GDCM-2.4.0-Windows-x86\bin\gdcmtar.exe'
		,"DCMULTI"=>'C:\soft\dicom\dicom3tools\dcmulti.exe'
		,"DCMODIFY"=>'C:\soft\dicom\dcmtk-3.6.0-win32-i386\bin\dcmodify.exe'
		,"DICOMROOT"=>'\\\dev-srv2\dicom'
		,"TEMPDIR"=>'\\\dev-srv2\temp\out\temp'
		,"OUTDIR"=>'\\\dev-srv2\temp\out'
);


?>