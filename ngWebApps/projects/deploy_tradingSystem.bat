%@Try%
  REM Normal code goes here
 call ng build --prod=true --project=tradingSystem
%@EndTry%
:@Catch
  REM Exception handling code goes here
:@EndCatch

robocopy ..\dist\tradingSystem "\\10.92.1.8\Ng Apps\tradingSystem" /E /S

curl -X GET -u wfi:WFI "http://10.92.1.8:9009/index.html?processname=TradingSystem&action=restart"
rem cmd /k
