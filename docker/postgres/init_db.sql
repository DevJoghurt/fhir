/*Init medplum db*/
CREATE USER medplum WITH PASSWORD 'medplum';
CREATE DATABASE medplum;
GRANT ALL PRIVILEGES ON DATABASE medplum TO medplum;
/*Init hapi db*/
CREATE USER hapi WITH PASSWORD 'admin';
CREATE DATABASE hapi;
GRANT ALL PRIVILEGES ON DATABASE hapi TO hapi;