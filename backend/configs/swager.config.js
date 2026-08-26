import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat App API",
      version: "1.0.0",
      description: "API documentation for the chat application",
    },
    servers: [
      {
        url: "http://localhost:5000",
      },
    ],
  },

  // Where Swagger will look for API documentation
  apis: ["./routes/*.js", "./controllers/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
