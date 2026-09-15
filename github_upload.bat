@echo off
echo ============================================
echo  Branded Outlet by Fatima - GitHub Upload
echo ============================================
echo.

set /p GITHUB_USERNAME=Apna GitHub Username enter karo: 

echo.
echo Git initialize ho raha hai...
git init

echo Files add ho rahi hain...
git add .

echo Commit ho raha hai...
git commit -m "Branded Outlet by Fatima - Live Deploy"

echo Branch set ho rahi hai...
git branch -M main

echo Remote add ho raha hai...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USERNAME%/branded-outlet-by-fatima.git

echo.
echo GitHub pe upload ho raha hai...
git push -u origin main

echo.
echo ============================================
echo  DONE! Ab Render.com pe deploy karo.
echo  DEPLOY_GUIDE.txt mein steps hain.
echo ============================================
pause
