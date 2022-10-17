%@Try%
  REM Normal code goes here
 call ng build --prod=true --project=portfolio-management
%@EndTry%
:@Catch
  REM Exception handling code goes here
:@EndCatch

robocopy ..\dist\portfolio-management "\\10.92.1.8\Ng Apps\portfolio-management" /E /S

curl -X GET -u wfi:WFI "http://10.92.1.8:9009/index.html?processname=PortfolioMgmt&action=restart"

rem cmd /k
