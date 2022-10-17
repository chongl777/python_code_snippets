%@Try%
  REM Normal code goes here
 call ng build --prod=true --project=crypto-trading
%@EndTry%
:@Catch
  REM Exception handling code goes here
:@EndCatch

robocopy ..\dist\crypto-trading "\\10.92.1.8\Ng Apps\crypto-trading" /E /S

curl -X GET -u wfi:WFI "http://10.92.1.8:9009/index.html?processname=CryptoTrading&action=restart"
rem cmd /k
