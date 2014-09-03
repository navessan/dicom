
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

function load_sql_old(strConnection, strSQL)
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

function load_sql(strConnection, strSQL)
{
	var connection = WScript.CreateObject("ADODB.connection");

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
	//rs.Open(strSQL, connection);
	rs=connection.Execute(strSQL);
	
	if(rs.eof )
		return null;
	
	var result;
	result=rs.GetRows.toArray();

	rs.close;
	connection.Close();
		
	return result;
}

function create_OpenStudyInfoXML(PatientID, array, source)
{
	//NOT IMPLEMEMENTED
/*
<AutomationOpenStudyInfo xmlns="urn:schemas-mergeefilm-com:hanging-protocol" PatientID="">
	<AutomationStudy xmlns="urn:schemas-mergeefilm-com:hanging-protocol" AccessionNumber="20673" StudyUID=""/>
	<AutomationStudy xmlns="urn:schemas-mergeefilm-com:hanging-protocol" AccessionNumber="20727" StudyUID=""/>
	<AutomationImageSource xmlns="urn:schemas-mergeefilm-com:hanging-protocol" GUID="{0CBB4846-0868-4f42-8AC3-63F5B8822AF6}"/>
</AutomationOpenStudyInfo>
*/
	strOpenStudyInfoXML=""+
	"<AutomationOpenStudyInfo xmlns=\"urn:schemas-mergeefilm-com:hanging-protocol\" PatientID=\"" +PatientID+"\">";
	
	strOpenStudyInfoXML=strOpenStudyInfoXML+"\n"+
	"	<AutomationStudy xmlns=\"urn:schemas-mergeefilm-com:hanging-protocol\" AccessionNumber=\"20673\" StudyUID=\"\"/>";
	
	strOpenStudyInfoXML=strOpenStudyInfoXML+"\n"+
	"	<AutomationImageSource xmlns=\"urn:schemas-mergeefilm-com:hanging-protocol\" GUID=\""+source+"\"/>"+
	+"</AutomationOpenStudyInfo>";
	
}

	var	    m_strAccNums="";			//The accession number of the study to be opened.
	var	    m_strPatientID="";			//The Patient ID of the study to be opened.
	var		m_strStudyUIDs="";			//The study instance UID of the study to be opened.
	var 	m_nLeft;
	var 	m_nTop;
	var 	m_nBottom;
	var 	m_nRight;
	var 	m_nSeriesCols=0;			//Specifies the series format (rows, columns) in which the study should open.  
	var 	m_nSeriesRows=0;
	var 	m_nImageCols=0;				//Specifies the image format (rows, columns) in which each series in the study should open.  
	var 	m_nImageRows=0;
	var 	m_bAddToWindow=0;			//TRUE:	Adds study to currently open document.
	var 	m_bCloseCurrentWindow=1;	//TRUE:	Closes current window and opens a new window for the new study.
	var 	m_bImageFormat=1;			//TRUE:	Automatically format image layout based on number of images in each series.
	var 	m_bSeriesFormat=1;      	//TRUE:	Automatically format series layout based on the number of series in study.
	var	    m_strImageSourceUIDs="";	
	
	var 	strOpenStudyInfoXML="";		//The primary and related studies (if any) as an XML list.
	var 	strProtocolListXML="";		//A list of potential protocols to apply to the study/studies.

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

		strSQL="SELECT StudyInstanceUID, Modality  " +
		"FROM Study " +
		"where PatientID=N'"+m_strPatientID+"' " +
		"and StudyDate='"+StudyDate+"' ";
	}
	else if(m_strImageSourceUIDs ==EFILM_REMOTE)
	{
		strConnection=REMOTE_DB_CONNECTION_STRING;
		
		strSQL="SELECT StudyInsta, StudyModal " +
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
	
	if(null==res || res.length==0)
	{
		WScript.echo("Study UID not found, exiting...");
		WScript.Quit(0);
	}else
	if(res.length==1)		//old behavior
	{
		m_strStudyUIDs=res[0];
		WScript.echo("Study UID="+m_strStudyUIDs);		
		m_strPatientID="";		//oleOpenStudy3 requires blank Patient ID and Accession Number
		m_strAccNums="";
	}
	else
	{
		WScript.echo("Study UID with modality:");
		
		var res_count=0;
		var col_cnt=2;		//column count for StudyInstanceUID, Modality
		var i=0;
		var x;
		count=res.length;

		//-------------------
		var strRow="";
		//debug output
		while(i<count)
		{
			strRow="";
			for(x=0;x<col_cnt;x++)
			{
				strRow=strRow+res[i+x]+"\t";
			}
			WScript.echo("i="+i+"\t "+strRow);
			
			i=i+x;
		}
		WScript.echo("count="+count);
		//---------------
		//opening studies here
		m_strPatientID="";		//oleOpenStudy3 requires blank Patient ID and Accession Number
		m_strAccNums="";
		//m_nSeriesCols=
		
		var Efilm = new ActiveXObject("EFilm.Document");
		
		i=0;
		modality="";
		
		while(i<count)
		{
			m_strStudyUIDs=res[i];
			modality=res[i+1];
			WScript.echo("Open StudyUID="+m_strStudyUIDs+"\t "+modality);
			
			if(modality=="CT" || modality=="MR"  || modality=="SR\\MR" )
			{
				m_bImageFormat=0;
				m_bSeriesFormat=0;
			}
			else
			{
				m_bImageFormat=1;
				m_bSeriesFormat=1;
			}
			
			if (!Efilm.oleOpenStudy3(m_strPatientID, m_strAccNums, m_strStudyUIDs, 
					m_bCloseCurrentWindow, m_bAddToWindow,
					m_nSeriesRows, m_nSeriesCols, m_nImageRows, m_nImageCols, 
					m_bSeriesFormat, m_bImageFormat, m_strImageSourceUIDs))
			{
				WScript.Echo("oleOpenStudy3 failed.");
			}
			else
			{
				WScript.Echo("oleOpenStudy3 OK.");
				m_bCloseCurrentWindow=0;
				m_bAddToWindow=1;
			}

			i=i+col_cnt;
		}
		
		WScript.Quit(0);
	}	
		
}

var Efilm = new ActiveXObject("EFilm.Document");

//var SW_SHOWNORMAL=1;
//Efilm.oleShowMainWindow(SW_SHOWNORMAL);
//Efilm.oleShowSearchWindow(SW_SHOWNORMAL);

m_bIncludeLayoutInfo=0;
if (strOpenStudyInfoXML!="" && !m_bIncludeLayoutInfo)
{
	if (!Efilm.oleOpenStudy4(strOpenStudyInfoXML, 
								m_bCloseCurrentWindow, 
								m_bFindRelatedStudies, 
								m_nNumPriors, 
								strProtocolListXML))
	{
		WScript.echo("oleOpenStudy4 failed.");
	}
}
else if(strOpenStudyInfoXML!="")
{
	if (!Efilm.oleOpenStudy5(strOpenStudyInfoXML, 
								m_nSeriesRows, m_nSeriesCols, m_nImageRows, m_nImageCols,
								m_bSuppressSearch, m_bCloseCurrentWindow, m_bFindRelatedStudies, m_nNumPriors,
								m_bApplyProtocol, strProtocolListXML))
	{
		WScript.echo("oleOpenStudy5 failed.");
	}
}

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

