/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */


 const database = require("/opt/database.js");

 exports.handler = async (event) => {
   // Get the username from cognito
   const userName = event.userName
 
   // Add this user to the database
   await database.createUser(userName)
   return event 
 }
