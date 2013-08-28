@ECHO OFF
CD ../
set STARTDIR=%CD%

cd %STARTDIR%\source\assets\css

type leaflet-0.5.1.css jquery-ui-1.10.3.core.css jquery-ui-1.10.3.widgets.css jquery-ui-1.10.3.tabs.css style.css > %STARTDIR%/build/assets/css/map.css

cd %STARTDIR%/bin

"C:\Program Files (x86)\Java\jre7\bin\java" -jar %STARTDIR%/bin/yuicompressor-2.4.7.jar ../build/assets/css/map.css -o %STARTDIR%/build/assets/css/map.min.css

cd %STARTDIR%\source\assets\js

"C:\Program Files (x86)\Java\jre7\bin\java" -jar %STARTDIR%/bin/compiler.jar --js=jquery-1.10.1.min.js --js=jquery-ui-1.10.3.core.js --js=jquery-ui-1.10.3.widget.js --js=jquery-ui-1.10.3.tabs.js --js=leaflet-0.5.1.js --js=leaflet.utfgrid.js --js=tile.stamen.v1.2.1.js --js=map.js --js_output_file=%STARTDIR%\build\assets\js\map.min.js

cd %STARTDIR%

xcopy %STARTDIR%\source\assets\images\*.* %STARTDIR%\build\assets\images\ /e /y
xcopy %STARTDIR%\source\assets\ie\*.* %STARTDIR%\build\assets\ie /e /y
xcopy %STARTDIR%\source\assets\js\es5-shim.min.js %STARTDIR%\build\assets\js\es5-shim.min.js /y
xcopy %STARTDIR%\source\assets\js\xdr.js %STARTDIR%\build\assets\js\xdr.js /y
xcopy %STARTDIR%\source\assets\js\respond.min.js %STARTDIR%\build\assets\js\respond.min.js /y

cd bin