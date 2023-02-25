rem @echo off

call C:\Users\chong\Anaconda3\Scripts\activate.bat C:\Users\chong\Anaconda3
rem @echo off
@Set "BCPCMD=C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\bcp.exe"
@Set WORKON_HOME=C:\ProgramData\Anaconda3\envs
@Set PYTHONPATH=C:\Users\chong\Desktop\WFILib\pylib\libs
@Set PATH=%PATH%;C:\Users\chong\Desktop\WFILib\pylib\libs\webdriver
@Set PYTHONSTARTUP=C:\Users\chong\Desktop\WFILib\pylib\startup.py
python C:\Users\chong\Desktop\WFILib\pylib\FixDropCopy\fix_message_handler_uat.py
pause