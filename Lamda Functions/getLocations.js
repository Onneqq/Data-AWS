console.log("Loading function");

// Import AWS SDK
const aws = require("aws-sdk");

// Initialize S3 client
const s3 = new aws.S3({ apiVersion: "2006-03-01" });

// Exports the handler function as the entry point for the Lambda function
exports.handler = async (event) => {
  const bucketName = "";
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
        body: "You must provide a name\nExample: https://ocohhqq6n3.execute-api.ap-southeast-2.amazonaws.com/getLocations?name=Gendry&date=2021-02-23",
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
          body: "Invalid date format - (YYYY-MM-DD)\nExample: https://ocohhqq6n3.execute-api.ap-southeast-2.amazonaws.com/getLocations?name=Gendry&date=2021-02-23",
        };
      }
      // Convert the date value to ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
      searchedDate = new Date(searchedDate + "T00:00:00.000Z").toISOString();
    } else {
      return {
        statusCode: 404,
        body: "You must provide a date (YYYY-MM-DD)\nExample: https://ocohhqq6n3.execute-api.ap-southeast-2.amazonaws.com/getPersons?location=Ashemark&date=2021-02-04",
      };
    }

    // Loop through each location in the parsed data
    parsedData.forEach((location) => {
      // Loop through each person's visit at that location
      location.persons.forEach((personVisits) => {
        // Check if the person's name and the searched date is present in the visit data
        if (
          personVisits.person === searchedName &&
          personVisits.dates.includes(searchedDate)
        ) {
          // If a match is found, add the location to the results array
          results.push(location.location);
        }
      });
    });

    // Return message if no persons are found for specified person and date
    if (results.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "No locations found for the specified person and date.",
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
