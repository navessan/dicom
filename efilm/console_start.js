
/*
 JScript for starting Merge Healthcare eFilm from command line using Windows Script Host (CScript.exe) 
 based on eFilm Automation client from The eFilm HIS-RIS Connectivity SDK 
 
*/
function usage()
{
    WScript.Echo("Usage:");
    WScript.Echo("cscript "+WScript.ScriptName+" --src {local|remote} {--PatientID PatID|--AccessionNo AccNum|--StudyUID StudyUID}");
    WScript.Echo("examples:");
    WScript.Echo("cscript "+WScript.ScriptName+" --src local --PatientID 123456");
    WScript.Echo("cscript "+WScript.ScriptName+" --src remote --AccessionNo 201412311644");
    WScript.Echo("cscript "+WScript.ScriptName+" --src remote --StudyUID 1.2.392.2000");
    WScript.quit(-1);
}

	var	    m_strAccNums;           //The accession number of the study to be opened.
	var	    m_strPatientID;
	var     m_strStudyUIDs;
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

m_strAccNums="";
m_strPatientID="";
m_strStudyUIDs="";
m_strImageSourceUIDs="";

objArgs = WScript.Arguments;
if(objArgs.length<4)
    usage();

for (i = 0; i < objArgs.length-1; i++)
{
    //WScript.Echo("arg "+i+": "+objArgs(i));
    if (objArgs(i)=="--src")
    {
        if(objArgs(i+1)=="local")
            m_strImageSourceUIDs="{0CBB4846-0868-4f42-8AC3-63F5B8822AF6}";
        else if(objArgs(i+1)=="remote")
            m_strImageSourceUIDs="{E0763D32-B28B-42dd-9817-20EFA762BED9}";
        else
            usage();
    }
    if (objArgs(i)=="--PatientID")
        m_strPatientID=objArgs(i+1);

    if (objArgs(i)=="--AccessionNo")
        m_strAccNums=objArgs(i+1);
        
    if (objArgs(i)=="--StudyUID")
        m_strStudyUIDs=objArgs(i+1);
}

WScript.Echo("m_strAccNums="+        m_strAccNums);
WScript.Echo("m_strPatientID="+      m_strPatientID);
WScript.Echo("m_strStudyUIDs="+      m_strStudyUIDs);
WScript.Echo("m_strImageSourceUIDs="+m_strImageSourceUIDs);
WScript.Echo("");

if (m_strImageSourceUIDs == "" || (m_strStudyUIDs == "" && m_strPatientID == "" && m_strAccNums == ""))
    usage();

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

