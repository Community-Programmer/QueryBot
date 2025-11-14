@echo off
REM Build script for Docker-based chart generation on Windows

echo Building QueryBot Chart Generation Docker Environment...

REM Build the chart executor image
echo Building chart executor Docker image...
cd querybot_agent
docker build -f Dockerfile.chart-executor -t querybot-chart-executor .

if %ERRORLEVEL% EQU 0 (
    echo Chart executor image built successfully
) else (
    echo Failed to build chart executor image
    exit /b 1
)

cd ..

echo 🎉 Docker environment setup complete!
echo.
echo The chart generation will now run in completely isolated Docker containers with:
echo   - No network access
echo   - Limited memory (512MB^) and CPU (1 core^)
echo   - Non-root user execution
echo   - Isolated file system
echo.
echo To test the chart generation:
echo   python test_docker_chart_generation.py