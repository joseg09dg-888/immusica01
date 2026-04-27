@echo off
echo Setting up Windows Task Scheduler for IM Music QA (every 30 min)...
schtasks /create /tn "IMMusic QA" /tr "\"C:\Users\jose-\OneDrive\Escritorio\proyecto plataforma im\im musica mejorado\im-music front\scripts\run-qa.bat\"" /sc minute /mo 30 /f
echo Done. QA will run every 30 minutes automatically.
echo To disable: schtasks /delete /tn "IMMusic QA" /f
pause
