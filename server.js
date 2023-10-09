//----- (3rd LIBRARY) IMPORT MONGOOSE PACKAGE
const mongoose = require('mongoose');

/** With this first 2 line of code in place,
 * you can manage your environment-specific configuration in the config.env file,
 * making it easier to adjust settings and secrets without modifying your code.
 */
//----- (LIBRARY) IMPORT DOTENV LIBRARY
// imports the dotenv library, making its functionality available for use in your Node.js application.
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION Occurs Shutting Down');
  process.exit(1); // 1 -> There is an uncaught exception occurs
});

//  calls dotenv.config({ path: './config.env' }) to load environment variables from the specified config.env file
dotenv.config({ path: './config.env' });

//----- (FILE) IMPORT AAP.JS FILE
const app = require('./app');

/** DATABASE CONFIGURATION (LOCAL) -> GET THE VARIABLE FROM ENVIROMENT VARIABLE */
// const DB_LOCAL = process.env.DATABASE_LOCAL;

/** CONNECT TO LOCAL DATABASE  */
// mongoose.connect(DB_LOCAL).then(con => {console.log('DB Connection Successful')});

/** DATABASE CONFIGURATION (REMOTE) -> GET THE VARIABLE FROM ENVIROMENT VARIABLE */
const DB_REMOTE = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

/** Call the Mongoose connect method -> Pass the Database connection string */
mongoose.connect(DB_REMOTE).then((con) => {
  console.log('DB Connection Successful');
});

/**---------------------------------------------------------------------------------------------------------------- ## START SERVER */
const port = process.env.PORT || 8000;

// Call back function called as soon the server start listening
// Store the server object inside the server variable
const server = app.listen(port, () => {
  console.log(`App running on port ${port}..`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection Occurs Shutting Down');

  /** TECHNIQUE TO EXIT APPLICATION - IN REAL WORLD */
  /** This way we giving server some time to finish all the request */
  // 1) Need to close the server => When server close call a callback function
  server.close(() => {
    // 2) Inside the callback function => we exit the process
    process.exit(1); // 1 -> There is an uncaught exception occurs
  });
});
