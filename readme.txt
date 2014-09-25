
PHP Web based tool for creating one multiframe DICOM file from series stored in Merge Efilm Workstation database.
Uses The gdcmtar is a command line tool used to tar/untar multi-frames images (including SIEMENS MOSAIC file)

Created for exporting images to Planmeca Romexis Viewer, which base version can't open DICOMDIR from external programs. 

You’ll need installed:
1) Web server with PHP.
2) Microsoft SQL Server Driver for PHP 
	http://www.php.net/manual/en/book.sqlsrv.php
3) Windows binaries of the Grassroots DICOM with gdcmtar tool 
	http://sourceforge.net/projects/gdcm/
	or dcmulti from dicom3tools software
	http://www.dclunie.com/dicom3tools.html
4) Windows binaries of the DCMTK with dcmodify tool
	http://dicom.offis.de/dcmtk.php.en/
5) check config.php	
6) Turn on tcp/ip protocol in SQL server network configuration
