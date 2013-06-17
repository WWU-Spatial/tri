CD ../
set STARTDIR=%CD%

cd %STARTDIR%\source\assets\css

type style.css leaflet-0.5.1.css jquery-ui-1.10.3.core.css jquery-ui-1.10.3.widgets.css jquery-ui-1.10.3.tabs.css jquery.fancybox.css jquery.fancybox-buttons.css > %STARTDIR%/build/assets/css/map.css

cd %STARTDIR%/bin

"C:\Program Files (x86)\Java\jre7\bin\java" -jar %STARTDIR%/bin/yuicompressor-2.4.7.jar ../build/assets/css/map.css -o %STARTDIR%/build/assets/css/map.min.css

cd %STARTDIR%\source\assets\js

type jquery-1.10.0.js jquery-ui-1.10.3.core.js jquery-ui-1.10.3.widget.js jquery-ui-1.10.3.tabs.js jquery.fancybox.pack.js jquery.fancybox-buttons.js jquery.fancybox-media.js leaflet-0.5.1.js leaflet.utfgrid.js tile.stamen.v1.2.1.js map.js > %STARTDIR%/build/assets/js/map.js

cd %STARTDIR%

xcopy %STARTDIR%\source\assets\images\*.* %STARTDIR%\build\assets\images\ /e /y

xcopy %STARTDIR%\source\assets\css\ie.css %STARTDIR%\build\assets\css\ie.css /y
xcopy %STARTDIR%\source\assets\css\ie7.css %STARTDIR%\build\assets\css\ie7.css /y
xcopy %STARTDIR%\source\assets\css\ie8.css %STARTDIR%\build\assets\css\ie8.css /y
xcopy %STARTDIR%\source\assets\css\leaflet-ie-0.5.1.css %STARTDIR%\build\assets\css\leaflet-ie-0.5.1.css /y

xcopy %STARTDIR%\source\assets\js\es5-shim.min.js %STARTDIR%\build\assets\js\es5-shim.min.js /y