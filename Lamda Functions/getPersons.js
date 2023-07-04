// Find every PERSON that has visited a particular LOCATION on a particular date

// Import AWS SDK
const aws = require("aws-sdk");

// Initialize S3 client
const s3 = new aws.S3({ apiVersion: "2006-03-01" });

// Exports the handler function as the entry point for the Lambda function
exports.handler = async (event) => {
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
    if (!queryParameters || !queryParameters.location) {
      return {
        statusCode: 404,
        body: "You must provide a location\nExample: https://ocohhqq6n3.execute-api.ap-southeast-2.amazonaws.com/getPersons?location=Ashemark&date=2021-02-04",
      };
    }
    const searchedLocation = queryParameters.location;

    let searchedDate = queryParameters.date;

    // Checks if the provided date is in the correct format (YYYY-MM-DD), and returns a 400 response if not
    if (searchedDate) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      if (!dateRegex.test(searchedDate)) {
        return {
          statusCode: 400,
          body: "Invalid date format - (YYYY-MM-DD)\nExample: https://ocohhqq6n3.execute-api.ap-southeast-2.amazonaws.com/getPersons?location=Ashemark&date=2021-02-04",
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

    // Loops through the data and checks if the location matches the searched location
    parsedData.forEach((location) => {
      if (location.location === searchedLocation) {
        // loops through the persons array and checks if the searched date is in the dates array
        location.persons.forEach((person) => {
          if (person.dates.includes(searchedDate)) {
            results.push(person.person);
          }
        });
      }
    });

    // Return message if no results found for specified location and date
    if (results.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "No persons found for the specified location and date.",
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
