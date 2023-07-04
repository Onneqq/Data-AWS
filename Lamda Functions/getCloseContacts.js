console.log("Loading function");

// Import AWS SDK
const aws = require("aws-sdk");

// Initialize S3 client
const s3 = new aws.S3({ apiVersion: "2006-03-01" });

// Exports the handler function as the entry point for the Lambda function
exports.handler = async (event) => {
  // Set the name of the S3 bucket and the name of the key for the data object
  const bucketName = "locationdata93";
  const key = "data.json";

  // Set parameters for S3 getObject call
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    // Fetch data from S3 object and parse data as JSON
    const data = await s3.getObject(params).promise();
    const parsedData = JSON.parse(data.Body.toString());

    const results = [];
    const queryParameters = event.queryStringParameters || null;

    // Check if name parameter is present in query string
    if (!queryParameters || !queryParameters.name) {
      return {
        statusCode: 404,
        body: "You must provide a name\nExample: https://ocohhqq6n3.execute-api.ap-southeast-2.amazonaws.com/getCloseContacts?name=Gendry&date=2021-02-05",
      };
    }
    const searchedName = queryParameters.name;

    let searchedDate = queryParameters.date;

    // Checks if the provided date is in the correct format (YYYY-MM-DD), and returns a 400 response if not
    if (searchedDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(searchedDate)) {
        return {
          statusCode: 400,
          body: "Invalid date format - (YYYY-MM-DD)\nExample: https://ocohhqq6n3.execute-api.ap-southeast-2.amazonaws.com/getCloseContacts?name=Gendry&date=2021-02-05",
        };
      }
      // Convert the date value to ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
      searchedDate = new Date(searchedDate + "T00:00:00.000Z").toISOString();
    } else {
      return {
        statusCode: 404,
        body: "You must provide a date (YYYY-MM-DD)\nExample: https://ocohhqq6n3.execute-api.ap-southeast-2.amazonaws.com/getCloseContacts?name=Gendry&date=2021-02-05",
      };
    }

    // Loop through each location in the parsed data
    parsedData.forEach((location) => {
      // Check if the searched name and date are present in the visit data for the location
      if (
        location.persons.some(
          (personVisits) =>
            personVisits.person === searchedName &&
            personVisits.dates.includes(searchedDate)
        )
      ) {
        // If the searched name and date are present, loop through the other visitors at the location
        location.persons.forEach((personVisits) => {
          // Check if the visitor is not the searched name and was at the location on the searched date
          if (
            personVisits.person !== searchedName &&
            personVisits.dates.includes(searchedDate)
          ) {
            // Add the visitor's name to the results array if they were at the location on the searched date
            results.push(personVisits.person);
          }
        });
      }
    });

    // Return message if no results are found for specified person and date
    if (results.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "No close contacts found for the specified name and date.",
        }),
      };
    }

    // Return a success response with the results array as the response body
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (err) {
    // Returns a 500 response if there is an error
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
