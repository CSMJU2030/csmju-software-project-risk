@echo off
cd /d D:\SoftwareProjectRisk
echo ==PUBLIC DECORATOR USAGE==
findstr /s /n "Public()" backend\src\*.ts
echo.
echo ==REQUIRE PERMISSIONS USAGE==
findstr /s /n "RequirePermissions(Permission" backend\src\*.ts
echo.
echo ==CONTROLLER ROUTES==
findstr /s /n "Controller(" backend\src\*.ts
echo.
echo ==PRISMA RELATIONS AND INDEXES==
findstr /n "index unique onDelete model " backend\prisma\schema.prisma
