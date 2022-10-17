%@Try%
  REM Normal code goes here
 call ng build --prod=true --project=email-processor
%@EndTry%
:@Catch
  REM Exception handling code goes here
:@EndCatch

robocopy ..\dist\email-processor "\\10.92.1.8\Ng Apps\email-processor" /E /S

curl -X GET -u wfi:WFI "http://10.92.1.8:9009/index.html?processname=EmailProcessor&action=restart"

cmd /k
