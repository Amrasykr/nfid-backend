const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NFID Backend API",
      version: "1.0.0",
      description: "API documentation for NFID Backend - Dispenser Management System",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Dispensers",
        description: "Dispenser management endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Usage History",
        description: "Usage history tracking endpoints",
      },
    ],
  },
  // Read API documentation from separate YAML files
  apis: ["./docs/swagger/*.yaml"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

