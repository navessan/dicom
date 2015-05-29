@echo off

rem echo %0 %1 %2 %3

set src=%1

set dst=c:/temp/out/image.dcm

rem echo %src%

set PATH=%PATH%;C:\soft\dicom\dicom3tools

@echo on

dcmulti %src%/* -verbose -copyall -sortby InstanceNumber -descending> %dst%

pause
