module.exports = {
  apps: [
    {
      name: '3p-partner-backend',
      cwd: './backend',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3032,
        DATABASE_URL: 'sqlserver://PRM-SRV-MSSQL-01.komus.net:59587;database=SPOe_rc;user=sa;password=icY2eGuyfU;encrypt=true;trustServerCertificate=true',
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true,
    },
  ],
};
