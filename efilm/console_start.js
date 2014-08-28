
/*
 JScript for starting Merge Healthcare eFilm from command line using Windows Script Host (CScript.exe) 
 based on eFilm Automation client from The eFilm HIS-RIS Connectivity SDK 

 For using search from SQL databases check connection strings.
 MySQL DB connection requires mysql-connector-odbc
*/

var REMOTE_DB_CONNECTION_STRING="DRIVER=MySQL ODBC 5.3 ANSI Driver;" +
		"SERVER=192.168.10.65;" +
		"DATABASE=conquest;" +
		"UID=web;PWD=CHANGEME;charset=latin1";//CHANGEME

var LOCAL_DB_CONNECTION_STRING="Provider=sqlncli;Data Source=localhost;" +
		"Initial Catalog = eFilmWorkstation;" +
		"User id = sa;" +
		"Password=eFilmWS30";


function usage()
{
    WScript.Echo("Usage:");
    WScript.Echo("cscript "+WScript.ScriptName+" --src {local|remote} {--PatientID PatID|--AccessionNo AccNum|--StudyUID StudyUID} {--StudyDate Date}");
    WScript.Echo("examples:");
    WScript.Echo("For open all images from all studies by patient:");
    WScript.Echo("cscript "+WScript.ScriptName+" --src local --PatientID 123456");
    WScript.Echo("");
    WScript.Echo("For open images from study by patient and date:");
    WScript.Echo("cscript "+WScript.ScriptName+" --src local --PatientID 123456 --StudyDate 20140801");
    WScript.Echo("");
    WScript.Echo("cscript "+WScript.ScriptName+" --src remote --AccessionNo 201412311644");
    WScript.Echo("cscript "+WScript.ScriptName+" --src remote --StudyUID 1.2.392.2000");
    WScript.quit(-1);
}

function load_sql(strConnection, strSQL)
{
	var connection = WScript.CreateObject("ADODB.connection");

	//var strConnection="Provider=sqlncli;Data Source=localhost;Initial Catalog = eFilmWorkstation;User id = sa;Password=eFilmWS30";
	//var strConnection="Provider=sqloledb;Data Source=localhost,1433;Initial Catalog = eFilmWorkstation;User id =sa;Password=eFilmWS30";
	
	try
	{
	WScript.echo ("opening...");
	WScript.echo ("con="+strConnection);
	connection.Open(strConnection);

	}
	catch(err)
	{
		msg="Connection error: \n" + err.number +"\n" + err.description;
		WScript.echo (msg);
		WScript.Quit(1);
	}

	var rs = new ActiveXObject("ADODB.Recordset");
	
	//rs.Open("select name from master..sysdatabases", connection);
	rs.Open(strSQL, connection);
	if(!rs.eof)
		rs.MoveFirst;

	var result = new Array();
	var i=0;
	
	while(!rs.eof)
	{
		result[i]=""+rs.fields(0);		//string
		//WScript.echo(rs.fields(0));
		//WScript.echo("i="+i+"\t var="+result[i]);
		i++;
		rs.movenext;
	}
	
	rs.close;
	connection.Close();
	
	return result;
}


	var	    m_strAccNums;           //The accession number of the study to be opened.
	var	    m_strPatientID;			//The Patient ID of the study to be opened.
	var     m_strStudyUIDs;			//The study instance UID of the study to be opened.
	var 	m_nLeft;
	var 	m_nTop;
	var 	m_nBottom;
	var 	m_nRight;
	var 	m_nSeriesCols;
	var 	m_nSeriesRows;
	var 	m_nImageCols;
	var 	m_nImageRows;
	var 	m_bAddToWindow;         //TRUE:	Adds study to currently open document.
	var 	m_bCloseCurrentWindow;  //TRUE:	Closes current window and opens a new window for the new study.
	var 	m_bImageFormat;         //TRUE:	Automatically format image layout based on number of images in each series.
	var 	m_bSeriesFormat;        //TRUE:	Automatically format series layout based on the number of series in study.
	var	    m_strImageSourceUIDs;

/*
Local Exams	    {0CBB4846-0868-4f42-8AC3-63F5B8822AF6}
Remote Exams	{E0763D32-B28B-42dd-9817-20EFA762BED9}
DICOMDIR	    {0317B1F9-A87A-4244-AD9B-022DCB31B8F8}
Image Channel	{2DC1E741-C299-4681-8ED0-C5185F30D11A}
*/
	var EFILM_LOCAL ="{0CBB4846-0868-4f42-8AC3-63F5B8822AF6}";
	var EFILM_REMOTE="{E0763D32-B28B-42dd-9817-20EFA762BED9}";

var	StudyDate;		//this parameter is not passed directly to efilm
StudyDate="";
	
m_strAccNums="";
m_strPatientID="";
m_strStudyUIDs="";
m_strImageSourceUIDs="";


objArgs = WScript.Arguments;
if(objArgs.length<4)
    usage();

for (var i = 0; i < objArgs.length-1; i++)
{
    //WScript.Echo("arg "+i+": "+objArgs(i));
    if (objArgs(i)=="--src")
    {
        if(objArgs(i+1)=="local")
            m_strImageSourceUIDs=EFILM_LOCAL;
        else if(objArgs(i+1)=="remote")
            m_strImageSourceUIDs=EFILM_REMOTE;
        else
            usage();
    }
    if (objArgs(i)=="--PatientID")
        m_strPatientID=objArgs(i+1);

    if (objArgs(i)=="--AccessionNo")
        m_strAccNums=objArgs(i+1);
        
    if (objArgs(i)=="--StudyUID")
        m_strStudyUIDs=objArgs(i+1);

    if (objArgs(i)=="--StudyDate")
    	StudyDate=objArgs(i+1);
}

WScript.Echo("m_strAccNums="+        m_strAccNums);
WScript.Echo("m_strPatientID="+      m_strPatientID);
WScript.Echo("m_strStudyUIDs="+      m_strStudyUIDs);
WScript.Echo("m_strImageSourceUIDs="+m_strImageSourceUIDs);
WScript.Echo("StudyDate="+			 StudyDate);
WScript.Echo("");

if (StudyDate != "" && m_strPatientID=="")
		WScript.Echo("StudyDate is set to \""+StudyDate+"\", but PatientID is empty, see usage");

if (m_strImageSourceUIDs == "" || (m_strStudyUIDs == "" && m_strPatientID == "" && m_strAccNums == ""))
    usage();

if (StudyDate != "" && m_strAccNums != "")
{
	WScript.Echo("The accession number is already set to \""+m_strAccNums+"\", ignoring StudyDate");
}
else 
if(StudyDate != "" && m_strStudyUIDs != "")
	WScript.Echo("The study instance UID is already set to \""+m_strStudyUIDs+"\", ignoring StudyDate");
else 
if(StudyDate != "")
{		
	//we need to find StudyUID from SQL database by patient and date
	
	//m_strPatientID=sql_escape(m_strPatientID);
	//StudyDate=sql_escape(StudyDate);
	
	var re = /([:;.,])/g;	//regexp for remove :;., 
	StudyDate=StudyDate.replace(re, "");
	
	if(StudyDate == "")
	{
		WScript.Echo("StudyDate has wrong format");
		WScript.Quit(1);
	}
	
	var strConnection="";
	var strSQL="";

	if(m_strImageSourceUIDs==EFILM_LOCAL)
	{
		strConnection=LOCAL_DB_CONNECTION_STRING;		

		strSQL="SELECT StudyInstanceUID  " +
		"FROM Study " +
		"where PatientID=N'"+m_strPatientID+"' " +
		"and StudyDate='"+StudyDate+"' ";
	}
	else if(m_strImageSourceUIDs ==EFILM_REMOTE)
	{
		strConnection=REMOTE_DB_CONNECTION_STRING;
		
		strSQL="SELECT StudyInsta " +
		"FROM dicomstudies " +
		"WHERE PatientID='"+m_strPatientID+"' " +
		"AND StudyDate='"+StudyDate+"' ";
	}
	else
	{
		WScript.Echo("Unknown Source "+m_strImageSourceUIDs+"\n");
		usage();
	}

	WScript.echo(strSQL);
	var res=load_sql(strConnection, strSQL);
	
	WScript.echo("results");
	for(var i=0;i<res.length;i++)
	{
		WScript.echo("i="+i+"\t var="+res[i]);
	}
	
	if(null==res || res.length==0)
	{
		WScript.echo("Study UID not found, exiting...");
		WScript.Quit(0);
	}else
	if(res.length==1)
	{
		m_strStudyUIDs=res[0];
		m_strPatientID="";		//oleOpenStudy3 requires blank Patient ID and Accession Number
		m_strAccNums="";
	}
	else
	{
		//TODO create strStudyListXML
		WScript.echo("Multiple Study UID, exiting...");
		WScript.Quit(0);
	}	
	
	
}

var Efilm = new ActiveXObject("EFilm.Document");

//var SW_SHOWNORMAL=1;
//Efilm.oleShowMainWindow(SW_SHOWNORMAL);
//Efilm.oleShowSearchWindow(SW_SHOWNORMAL);

m_bCloseCurrentWindow=1;
m_bSeriesFormat=1;
m_bImageFormat=1;

if (m_strImageSourceUIDs != "" && m_strStudyUIDs != "")
{
	// oleOpenStudy3
	/*
	Use this automation call to open a given study from a particular image source,
	through another application external to eFilm Workstation.  
	If the Patient ID and/or the Accession Number is provided, the Study Instance UID is ignored.  
	The Study Instance UID is used if and only if the Patient ID and Accession Number are both left blank.
	 */
	if (!Efilm.oleOpenStudy3(m_strPatientID, m_strAccNums, m_strStudyUIDs, 
									 m_bCloseCurrentWindow, m_bAddToWindow,
									 m_nSeriesRows, m_nSeriesCols, m_nImageRows, m_nImageCols, 
									 m_bSeriesFormat, m_bImageFormat, m_strImageSourceUIDs))
	{
		WScript.Echo("oleOpenStudy3 failed.");
	}
	else
	    WScript.Echo("oleOpenStudy3 OK.");
}
else if (m_strImageSourceUIDs != "" && (m_strPatientID != "" || m_strAccNums != ""))
{
		// oleOpenStudy2
		if (!Efilm.oleOpenStudy2(m_strPatientID, m_strAccNums, 
									 m_bCloseCurrentWindow, m_bAddToWindow,
									 m_nSeriesRows, m_nSeriesCols, m_nImageRows, m_nImageCols, 
									 m_bSeriesFormat, m_bImageFormat, m_strImageSourceUIDs))
		{
			WScript.Echo("oleOpenStudy2 failed.");
		}
		else
		    WScript.Echo("oleOpenStudy2 OK.");
}
else
	WScript.Echo("Please supply more study information");

