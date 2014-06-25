@echo off

rem echo %0 %1 %2 %3
set dicomRoot=\\dev-srv2\dicom\
set StudyUID=%1
set SeriesUID=%2
set FrameOfReferenceUID=%3
set Patient=%4

set src=%dicomRoot%\%StudyUID%\%SeriesUID%
set dst=\\dev-srv2\temp\out

rem echo %src%
rem dir "%src%"

set PATH=%PATH%;C:\soft\dicom\GDCM-2.4.0-Windows-x86\bin
@echo on
gdcmtar -V -i %src% -o %dst%

dir %dst%\%StudyUID%\%SeriesUID%\%FrameOfReferenceUID%
copy /Y %dst%\%StudyUID%\%SeriesUID%\%FrameOfReferenceUID%\new.dcm %dst%\%SeriesUID%.dcm

rem ping dev-srv2

